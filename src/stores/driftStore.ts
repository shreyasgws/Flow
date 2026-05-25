import { create } from 'zustand'
import { db } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'
import type { DriftEntry } from '@/types'

interface DriftStore {
  entries: DriftEntry[]
  isLoading: boolean
  error: string | null
  loadEntries: () => Promise<void>
  addEntry: (text: string, source?: DriftEntry['source']) => Promise<DriftEntry | null>
  updateEntry: (id: string, text: string) => Promise<void>
  archiveEntry: (id: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  purgeArchived: () => Promise<void>
  getActiveEntries: () => DriftEntry[]
}

export const useDriftStore = create<DriftStore>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const all = await retryWithBackoff(() => db.driftEntries.toArray())
      const entries = all.filter((e) => e.isArchived !== true)
      entries.sort((a, b) => b.createdAt - a.createdAt)
      set({ entries, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load drift' })
      useErrorStore.getState().push('database')
    }
  },

  addEntry: async (text, source = 'manual') => {
    set({ error: null })
    const entry: DriftEntry = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isArchived: false,
      source,
    }
    try {
      await retryWithBackoff(() => db.driftEntries.add(entry))
      queueWrite('upsert', 'driftEntries', entry.id, entry)
      set((s) => ({ entries: [entry, ...s.entries] }))
      return entry
    } catch {
      set({ error: 'Failed to save drift' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t save that thought', description: 'It\'s still here. Try again.' })
      return null
    }
  },

  updateEntry: async (id, text) => {
    set({ error: null })
    const prev = get().entries.find((e) => e.id === id)
    if (!prev) return
    const now = Date.now()
    try {
      await retryWithBackoff(() => db.driftEntries.update(id, { text, updatedAt: now }))
      queueWrite('upsert', 'driftEntries', id, { ...prev, text, updatedAt: now })
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id ? { ...e, text, updatedAt: now } : e
        ),
      }))
      pushUndo(id, `Edited drift`, async () => {
        await retryWithBackoff(() => db.driftEntries.update(id, { text: prev.text, updatedAt: Date.now() }))
        queueWrite('upsert', 'driftEntries', id, { ...prev, text: prev.text, updatedAt: Date.now() })
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, text: prev.text, updatedAt: Date.now() } : e
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to update drift' })
      useErrorStore.getState().push('database')
    }
  },

  archiveEntry: async (id) => {
    set({ error: null })
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    try {
      await retryWithBackoff(() => db.driftEntries.update(id, { isArchived: true }))
      queueWrite('upsert', 'driftEntries', id, { ...entry, isArchived: true })
      set((s) => ({
        entries: s.entries.filter((e) => e.id !== id),
      }))
      pushUndo(id, `Archived drift`, async () => {
        await retryWithBackoff(() => db.driftEntries.update(id, { isArchived: false }))
        queueWrite('upsert', 'driftEntries', id, { ...entry, isArchived: false })
        set((s) => ({
          entries: [{ ...entry, isArchived: false }, ...s.entries],
        }))
      })
    } catch {
      set({ error: 'Failed to archive drift' })
      useErrorStore.getState().push('database')
    }
  },

  deleteEntry: async (id) => {
    set({ error: null })
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    try {
      await retryWithBackoff(() => db.driftEntries.delete(id))
      queueWrite('delete', 'driftEntries', id, {})
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
      pushUndo(id, `Deleted drift`, async () => {
        const restored = { ...entry, id: crypto.randomUUID() }
        await retryWithBackoff(() => db.driftEntries.add(restored))
        queueWrite('upsert', 'driftEntries', restored.id, restored)
        set((s) => ({
          entries: [restored, ...s.entries],
        }))
      })
    } catch {
      set({ error: 'Failed to delete drift' })
      useErrorStore.getState().push('database')
    }
  },

  purgeArchived: async () => {
    set({ error: null })
    try {
      const all = await retryWithBackoff(() => db.driftEntries.toArray())
      const archived = all.filter((e) => e.isArchived)
      if (archived.length === 0) return
      const ids = archived.map((e) => e.id)
      await retryWithBackoff(() => db.driftEntries.bulkDelete(ids))
      for (const entry of archived) {
        queueWrite('delete', 'driftEntries', entry.id, {})
      }
      pushUndo(`purge-${Date.now()}`, `Purged ${archived.length} archived drifts`, async () => {
        await retryWithBackoff(() => db.driftEntries.bulkAdd(archived))
        for (const entry of archived) {
          queueWrite('upsert', 'driftEntries', entry.id, entry)
        }
      })
    } catch {
      set({ error: 'Failed to purge drift' })
      useErrorStore.getState().push('database')
    }
  },

  getActiveEntries: () => {
    const now = Date.now()
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000
    return get().entries.filter((e) => now - e.createdAt < SEVENTY_TWO_HOURS)
  },
}))
