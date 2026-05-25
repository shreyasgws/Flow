import { db, type SyncQueueItem } from '@/lib/db'
import { useSyncStore } from '@/stores/syncStore'
import { useErrorStore } from '@/stores/errorStore'
import type { SupabaseClient, User } from '@supabase/supabase-js'

const DEBOUNCE_MS = 500
const MAX_RETRIES = 3
const BACKOFF_DELAYS = [1000, 2000, 4000]

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function queueWrite(
  action: SyncQueueItem['action'],
  table: string,
  recordId: string,
  payload: unknown,
) {
  db.syncQueue.add({
    action,
    table,
    recordId,
    payload,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  })
  debouncedFlush()
}

function debouncedFlush() {
  if (debounceTimer) clearTimeout(debounceTimer)
  useSyncStore.getState().setStatus('saving')
  debounceTimer = setTimeout(flushQueue, DEBOUNCE_MS)
}

export async function flushQueue() {
  const pending = await db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('timestamp')

  if (pending.length === 0) {
    useSyncStore.getState().setStatus('idle')
    return
  }

  useSyncStore.getState().setStatus('syncing')
  const { getSupabase } = await import('@/lib/supabase')
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { useSyncStore.getState().setStatus('offline'); return }

  for (const item of pending) {
    const success = await processItem(item, supabase, user.id)
    if (success) {
      await db.syncQueue.update(item.id!, { status: 'synced' })
    } else if (item.retries >= MAX_RETRIES) {
      await db.syncQueue.update(item.id!, { status: 'failed' })
      useSyncStore.getState().setStatus('offline')
    } else {
      const delay = BACKOFF_DELAYS[item.retries] ?? 4000
      await db.syncQueue.update(item.id!, { retries: item.retries + 1 })
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  const remaining = await db.syncQueue.where('status').equals('pending').count()
  if (remaining === 0) {
    useSyncStore.getState().setStatus('saved')
    useSyncStore.getState().setLastSynced(Date.now())
    setTimeout(() => {
      useSyncStore.getState().setStatus('idle')
    }, 2000)
  }
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

function preparePayload(
  payload: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = { user_id: userId }
  for (const [key, value] of Object.entries(payload)) {
    result[toSnakeCase(key)] = value
  }
  return result
}

async function processItem(
  item: SyncQueueItem,
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const tableName = mapTable(item.table)
    if (item.action === 'delete') {
      const { error } = await supabase.from(tableName).delete().eq('id', item.recordId)
      if (error) throw error
    } else {
      const payload = preparePayload(item.payload as Record<string, unknown>, userId)
      const { error } = await supabase.from(tableName).upsert(payload as never)
      if (error) throw error
    }
    return true
  } catch {
    return false
  }
}

function mapTable(local: string): string {
  const map: Record<string, string> = {
    tasks: 'tasks',
    flowSections: 'flow_sections',
    driftEntries: 'drift_entries',
    reflections: 'reflections',
    categories: 'categories',
    templates: 'templates',
    settings: 'settings',
  }
  return map[local] ?? local
}

export async function flushQueueOnce(): Promise<void> {
  const pending = await db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('timestamp')

  if (pending.length === 0) return

  let supabase
  try {
    const { getSupabase } = await import('@/lib/supabase')
    supabase = getSupabase()
  } catch { return }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  for (const item of pending) {
    try {
      const tableName = mapTable(item.table)
      if (item.action === 'delete') {
        const { error } = await supabase.from(tableName).delete().eq('id', item.recordId)
        if (error) continue
      } else {
        const payload = preparePayload(item.payload as Record<string, unknown>, user.id)
        const { error } = await supabase.from(tableName).upsert(payload as never)
        if (error) continue

      }
      await db.syncQueue.update(item.id!, { status: 'synced' })
    } catch { /* skip retries — best effort for sign-out */ }
  }
}

export async function flushFailed() {
  const failed = await db.syncQueue.where('status').equals('failed').toArray()
  for (const item of failed) {
    await db.syncQueue.update(item.id!, { retries: 0, status: 'pending' })
  }
  debouncedFlush()
}

const TABLE_MAP_REVERSE: Record<string, string> = {
  tasks: 'tasks',
  flow_sections: 'flowSections',
  drift_entries: 'driftEntries',
  reflections: 'reflections',
  categories: 'categories',
  templates: 'templates',
  settings: 'settings',
}

export async function pullFromSupabase(): Promise<void> {
  const { getSupabase } = await import('@/lib/supabase')
  let supabase
  try { supabase = getSupabase() } catch { return }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const remoteTables = ['tasks', 'flow_sections', 'drift_entries', 'reflections', 'categories', 'templates', 'settings']

  for (const table of remoteTables) {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) continue
      if (!data || data.length === 0) continue

      const localTable = TABLE_MAP_REVERSE[table]
      if (!localTable) continue

      if (localTable === 'tasks') await db.tasks.bulkPut(data as any[])
      else if (localTable === 'flowSections') await db.flowSections.bulkPut(data as any[])
      else if (localTable === 'driftEntries') await db.driftEntries.bulkPut(data as any[])
      else if (localTable === 'reflections') await db.reflections.bulkPut(data as any[])
      else if (localTable === 'categories') await db.categories.bulkPut(data as any[])
      else if (localTable === 'templates') await db.templates.bulkPut(data as any[])
      else if (localTable === 'settings') {
        for (const row of data) {
          await db.settings.put(row as any)
        }
      }
    } catch {}
  }
}
