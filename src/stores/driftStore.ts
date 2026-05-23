import { create } from 'zustand'
import { db } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
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
  getActiveEntries: () => DriftEntry[]
}

export const useDriftStore = create<DriftStore>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const all = await db.driftEntries.toArray()
      const entries = all.filter((e) => e.isArchived !== true)
      entries.sort((a, b) => b.createdAt - a.createdAt)
      set({ entries, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load drift' })
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
      await db.driftEntries.add(entry)
      set((s) => ({ entries: [entry, ...s.entries] }))
      return entry
    } catch {
      set({ error: 'Failed to save drift' })
      return null
    }
  },

  updateEntry: async (id, text) => {
    set({ error: null })
    const prev = get().entries.find((e) => e.id === id)
    if (!prev) return
    const now = Date.now()
    try {
      await db.driftEntries.update(id, { text, updatedAt: now })
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id ? { ...e, text, updatedAt: now } : e
        ),
      }))
    } catch {
      set({ error: 'Failed to update drift' })
    }
  },

  archiveEntry: async (id) => {
    set({ error: null })
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    try {
      await db.driftEntries.update(id, { isArchived: true })
      set((s) => ({
        entries: s.entries.filter((e) => e.id !== id),
      }))
      pushUndo(id, `Archived drift`, async () => {
        await db.driftEntries.update(id, { isArchived: false })
        set((s) => ({
          entries: [{ ...entry, isArchived: false }, ...s.entries],
        }))
      })
    } catch {
      set({ error: 'Failed to archive drift' })
    }
  },

  deleteEntry: async (id) => {
    set({ error: null })
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    try {
      await db.driftEntries.delete(id)
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
      pushUndo(id, `Deleted drift`, async () => {
        const restored = { ...entry, id: crypto.randomUUID() }
        await db.driftEntries.add(restored)
        set((s) => ({
          entries: [restored, ...s.entries],
        }))
      })
    } catch {
      set({ error: 'Failed to delete drift' })
    }
  },

  getActiveEntries: () => {
    const now = Date.now()
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000
    return get().entries.filter((e) => now - e.createdAt < SEVENTY_TWO_HOURS)
  },
}))
