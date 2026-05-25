import { create } from 'zustand'
import type { FlowSection } from '@/types'
import { db } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'

interface FlowSectionStore {
  sections: FlowSection[]
  isLoading: boolean
  error: string | null
  loadSections: () => Promise<void>
  addSection: (section: Omit<FlowSection, 'id' | 'createdAt'>) => Promise<FlowSection | null>
  updateSection: (id: string, data: Partial<FlowSection>) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  batchReorder: (updates: { id: string; sortOrder: number }[]) => Promise<void>
  reorderSection: (id: string, sortOrder: number) => Promise<void>
}

export const useFlowSectionStore = create<FlowSectionStore>((set, get) => ({
  sections: [],
  isLoading: false,
  error: null,

  loadSections: async () => {
    set({ isLoading: true, error: null })
    try {
      const sections = await retryWithBackoff(() => db.flowSections.toArray())
      sections.sort((a, b) => a.sortOrder - b.sortOrder)
      set({ sections, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load sections' })
      useErrorStore.getState().push('database')
    }
  },

  addSection: async (partial) => {
    set({ error: null })
    const section: FlowSection = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    try {
      await retryWithBackoff(() => db.flowSections.add(section))
      queueWrite('upsert', 'flowSections', section.id, section)
      set((s) => ({ sections: [...s.sections, section] }))
      return section
    } catch {
      set({ error: 'Failed to add section' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t create section', description: 'Try again.' })
      return null
    }
  },

  updateSection: async (id: string, data: Partial<FlowSection>) => {
    set({ error: null })
    const prev = get().sections.find((s) => s.id === id)
    if (!prev) return
    try {
      await retryWithBackoff(() => db.flowSections.update(id, data))
      const updated = { ...prev, ...data }
      queueWrite('upsert', 'flowSections', id, updated)
      set((s) => ({
        sections: s.sections.map((sec) =>
          sec.id === id ? updated : sec
        ),
      }))
      const label = data.name ? `Renamed "${prev.name}"` : `Updated "${prev.name}"`
      pushUndo(id, label, async () => {
        await retryWithBackoff(() => db.flowSections.update(id, prev))
        queueWrite('upsert', 'flowSections', id, prev)
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, ...prev } : sec
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to update section' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t update section', description: 'Try again.' })
    }
  },

  deleteSection: async (id: string) => {
    set({ error: null })
    const section = get().sections.find((s) => s.id === id)
    if (!section) return
    try {
      await retryWithBackoff(() => db.flowSections.delete(id))
      queueWrite('delete', 'flowSections', id, {})
      set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) }))
      pushUndo(id, `Deleted section "${section.name}"`, async () => {
        const restored = { ...section, id: crypto.randomUUID() }
        await retryWithBackoff(() => db.flowSections.add(restored))
        queueWrite('upsert', 'flowSections', restored.id, restored)
        set((s) => ({
          sections: [...s.sections, restored].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to delete section' })
      useErrorStore.getState().push('database')
    }
  },

  batchReorder: async (updates) => {
    set({ error: null })
    const prevStates = updates.map((u) => {
      const s = get().sections.find((sec) => sec.id === u.id)
      return s ? { id: s.id, sortOrder: s.sortOrder } : null
    }).filter(Boolean) as { id: string; sortOrder: number }[]
    try {
      await retryWithBackoff(() => db.transaction('rw', db.flowSections, async () => {
        for (const u of updates) {
          await db.flowSections.update(u.id, { sortOrder: u.sortOrder })
          const section = get().sections.find((sec) => sec.id === u.id)
          if (section) {
            queueWrite('upsert', 'flowSections', u.id, { ...section, sortOrder: u.sortOrder })
          }
        }
      }))
      set((s) => ({
        sections: s.sections
          .map((sec) => {
            const update = updates.find((u) => u.id === sec.id)
            return update ? { ...sec, sortOrder: update.sortOrder } : sec
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      pushUndo(`batch-section-${Date.now()}`, `Reordered sections`, async () => {
        await retryWithBackoff(() => db.transaction('rw', db.flowSections, async () => {
          for (const p of prevStates) {
            await db.flowSections.update(p.id, { sortOrder: p.sortOrder })
            const section = get().sections.find((sec) => sec.id === p.id)
            if (section) {
              queueWrite('upsert', 'flowSections', p.id, { ...section, sortOrder: p.sortOrder })
            }
          }
        }))
        set((s) => ({
          sections: s.sections.map((sec) => {
            const prev = prevStates.find((p) => p.id === sec.id)
            return prev ? { ...sec, sortOrder: prev.sortOrder } : sec
          }).sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to reorder sections' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t reorder', description: 'The order may not have saved.' })
    }
  },

  reorderSection: async (id: string, sortOrder: number) => {
    set({ error: null })
    const prev = get().sections.find((s) => s.id === id)
    if (!prev) return
    try {
      await retryWithBackoff(() => db.flowSections.update(id, { sortOrder }))
      queueWrite('upsert', 'flowSections', id, { ...prev, sortOrder })
      set((s) => ({
        sections: s.sections
          .map((sec) => (sec.id === id ? { ...sec, sortOrder } : sec))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      pushUndo(id, `Moved section "${prev.name}"`, async () => {
        await retryWithBackoff(() => db.flowSections.update(id, { sortOrder: prev.sortOrder }))
        queueWrite('upsert', 'flowSections', id, { ...prev, sortOrder: prev.sortOrder })
        set((s) => ({
          sections: s.sections
            .map((sec) => (sec.id === id ? { ...sec, sortOrder: prev.sortOrder } : sec))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to reorder section' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t reorder', description: 'The order may not have saved.' })
    }
  },
}))
