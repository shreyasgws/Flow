import type { FlowDatabase, SyncQueueItem } from '@/lib/db'
import { getDb, getDbNamespace } from '@/lib/db'
import { useSyncStore } from '@/stores/syncStore'
import { useAuthStore } from '@/stores/authStore'
import type { SupabaseClient } from '@supabase/supabase-js'

function getCurrentDb(): FlowDatabase {
  const state = useAuthStore.getState()
  return getDb(state.user?.id, state.user?.is_anonymous === true)
}

const DEBOUNCE_MS = 500
const MAX_RETRIES = 3
const BACKOFF_DELAYS = [1000, 2000, 4000]

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * queueWrite — stores pass the db from their user context.
 * Falls back to getCurrentDb() if no db provided.
 */
export function queueWrite(
  action: SyncQueueItem['action'],
  table: string,
  recordId: string,
  payload: unknown,
  db?: FlowDatabase,
) {
  const target = db ?? getCurrentDb()
  target.syncQueue.add({
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

let _realtimeSubscriptions: { unsubscribe: () => void }[] = []

export function detachAllRealtime(): void {
  _realtimeSubscriptions.forEach((s) => { try { s.unsubscribe() } catch {} })
  _realtimeSubscriptions = []
}

function tryBroadcastChange() {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel('flow-sync')
    channel.postMessage({ type: 'data-changed', sessionId: useSyncStore.getState().sessionId })
    channel.close()
  } catch {
  }
}

export async function flushQueue(db?: FlowDatabase) {
  const target = db ?? getCurrentDb()
  const pending = await target.syncQueue
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
      await target.syncQueue.update(item.id!, { status: 'synced' })
    } else if (item.retries >= MAX_RETRIES) {
      await target.syncQueue.update(item.id!, { status: 'failed' })
      useSyncStore.getState().setStatus('offline')
    } else {
      const delay = BACKOFF_DELAYS[item.retries] ?? 4000
      await target.syncQueue.update(item.id!, { retries: item.retries + 1 })
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  const remaining = await target.syncQueue.where('status').equals('pending').count()
  if (remaining === 0) {
    useSyncStore.getState().setStatus('saved')
    useSyncStore.getState().setLastSynced(Date.now())
    tryBroadcastChange()
    setTimeout(() => {
      useSyncStore.getState().setStatus('idle')
    }, 2000)
  }
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value
  }
  return result
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

export async function flushQueueOnce(db?: FlowDatabase): Promise<void> {
  const target = db ?? getCurrentDb()
  const pending = await target.syncQueue
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
      await target.syncQueue.update(item.id!, { status: 'synced' })
    } catch { /* skip retries — best effort for sign-out */ }
  }
}

export async function flushFailed() {
  const _db = getCurrentDb()
  const failed = await _db.syncQueue.where('status').equals('failed').toArray()
  for (const item of failed) {
    await _db.syncQueue.update(item.id!, { retries: 0, status: 'pending' })
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

export async function pullFromSupabase(userIdOverride?: string, isAnonymousOverride?: boolean): Promise<void> {
  const { getSupabase } = await import('@/lib/supabase')
  let supabase
  try { supabase = getSupabase() } catch { return }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Use the override if provided (e.g. during auth transitions), otherwise detect
  const targetUserId = userIdOverride ?? user.id
  const targetIsAnonymous = isAnonymousOverride ?? (user.is_anonymous === true)

  // Skip pull for anonymous users — they have no cloud data
  if (targetIsAnonymous) return

  const db = getDb(targetUserId, false)
  const remoteTables = ['tasks', 'flow_sections', 'drift_entries', 'reflections', 'categories', 'templates', 'settings']

  // Clear local data for this user BEFORE pulling — fresh sync from server
  await db.tasks.clear()
  await db.flowSections.clear()
  await db.driftEntries.clear()
  await db.reflections.clear()
  await db.categories.clear()
  await db.templates.clear()
  await db.settings.clear()

  for (const table of remoteTables) {
    try {
      // Scope query by user_id — only pull the authenticated user's data
      const { data: rawData, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', targetUserId)
      if (error) continue
      if (!rawData || rawData.length === 0) continue

      const camelData = rawData.map((r: Record<string, unknown>) => camelizeKeys(r))

      const localTable = TABLE_MAP_REVERSE[table]
      if (!localTable) continue

      if (localTable === 'tasks') await db.tasks.bulkAdd(camelData as any[])
      else if (localTable === 'flowSections') await db.flowSections.bulkAdd(camelData as any[])
      else if (localTable === 'driftEntries') await db.driftEntries.bulkAdd(camelData as any[])
      else if (localTable === 'reflections') await db.reflections.bulkAdd(camelData as any[])
      else if (localTable === 'categories') await db.categories.bulkAdd(camelData as any[])
      else if (localTable === 'templates') await db.templates.bulkAdd(camelData as any[])
      else if (localTable === 'settings') {
        for (const row of camelData) {
          await db.settings.put(row as any)
        }
      }
    } catch {
      // Skip failed tables — continue seeding what we can
    }
  }
}
