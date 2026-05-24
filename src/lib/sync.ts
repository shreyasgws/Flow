import { db, type SyncQueueItem } from '@/lib/db'
import { useSyncStore } from '@/stores/syncStore'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  const { supabase } = await import('@/lib/supabase')

  for (const item of pending) {
    const success = await processItem(item, supabase)
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

async function processItem(
  item: SyncQueueItem,
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const tableName = mapTable(item.table)
    if (item.action === 'delete') {
      const { error } = await supabase.from(tableName).delete().eq('id', item.recordId)
      if (error) throw error
    } else {
      const { error } = await supabase.from(tableName).upsert(item.payload as Record<string, unknown>)
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
    focusSessions: 'focus_sessions',
  }
  return map[local] ?? local
}

export async function flushFailed() {
  const failed = await db.syncQueue.where('status').equals('failed').toArray()
  for (const item of failed) {
    await db.syncQueue.update(item.id!, { retries: 0, status: 'pending' })
  }
  debouncedFlush()
}
