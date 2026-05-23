import { create } from 'zustand'
import type { FlowSection } from '@/types'
import { db } from '@/lib/db'
import { pushUndo } from '@/lib/undo'

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
      const sections = await db.flowSections.toArray()
      sections.sort((a, b) => a.sortOrder - b.sortOrder)
      set({ sections, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load sections' })
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
      await db.flowSections.add(section)
      set((s) => ({ sections: [...s.sections, section] }))
      return section
    } catch {
      set({ error: 'Failed to add section' })
      return null
    }
  },

  updateSection: async (id: string, data: Partial<FlowSection>) => {
    set({ error: null })
    const prev = get().sections.find((s) => s.id === id)
    if (!prev) return
    try {
      await db.flowSections.update(id, data)
      set((s) => ({
        sections: s.sections.map((sec) =>
          sec.id === id ? { ...sec, ...data } : sec
        ),
      }))
      const label = data.name ? `Renamed "${prev.name}"` : `Updated "${prev.name}"`
      pushUndo(id, label, async () => {
        await db.flowSections.update(id, prev)
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, ...prev } : sec
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to update section' })
    }
  },

  deleteSection: async (id: string) => {
    set({ error: null })
    const section = get().sections.find((s) => s.id === id)
    if (!section) return
    try {
      await db.flowSections.delete(id)
      set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) }))
      pushUndo(id, `Deleted section "${section.name}"`, async () => {
        const restored = { ...section, id: crypto.randomUUID() }
        await db.flowSections.add(restored)
        set((s) => ({
          sections: [...s.sections, restored].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to delete section' })
    }
  },

  batchReorder: async (updates) => {
    set({ error: null })
    try {
      await db.transaction('rw', db.flowSections, async () => {
        for (const u of updates) {
          await db.flowSections.update(u.id, { sortOrder: u.sortOrder })
        }
      })
      const ids = new Set(updates.map((u) => u.id))
      set((s) => ({
        sections: s.sections
          .map((sec) => {
            const update = updates.find((u) => u.id === sec.id)
            return update ? { ...sec, sortOrder: update.sortOrder } : sec
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
    } catch {
      set({ error: 'Failed to reorder sections' })
    }
  },

  reorderSection: async (id: string, sortOrder: number) => {
    set({ error: null })
    try {
      await db.flowSections.update(id, { sortOrder })
      set((s) => ({
        sections: s.sections
          .map((sec) => (sec.id === id ? { ...sec, sortOrder } : sec))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
    } catch {
      set({ error: 'Failed to reorder section' })
    }
  },
}))
