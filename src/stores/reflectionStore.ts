import { create } from 'zustand'
import { getDb } from '@/lib/db'
import { retryWithBackoff } from '@/lib/retry'
import { useErrorStore } from '@/stores/errorStore'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'
import type { Reflection } from '@/types'

interface ReflectionStore {
  reflections: Reflection[]
  isLoading: boolean
  error: string | null
  loadReflections: () => Promise<void>
  getReflectionForWeek: (weekStart: string) => Reflection | undefined
  saveReflection: (weekStart: string, content: string, categories: string[]) => Promise<void>
  deleteReflection: (id: string) => Promise<void>
  reset: () => void
}

const initialState = {
  reflections: [] as Reflection[],
  isLoading: false,
  error: null as string | null,
}

export const useReflectionStore = create<ReflectionStore>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  loadReflections: async () => {
    set({ isLoading: true, error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const reflections = await retryWithBackoff(() => db.reflections.toArray())
      reflections.sort((a, b) => b.createdAt - a.createdAt)
      set({ reflections, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load reflections' })
      useErrorStore.getState().push('database')
    }
  },

  getReflectionForWeek: (weekStart: string) => {
    return get().reflections.find((r) => r.weekStart === weekStart)
  },

  saveReflection: async (weekStart: string, content: string, categories: string[]) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const existing = get().reflections.find((r) => r.weekStart === weekStart)
    if (existing) {
      try {
        await retryWithBackoff(() => db.reflections.update(existing.id, { content, categories }))
        queueWrite('upsert', 'reflections', existing.id, { ...existing, content, categories }, db)
        set((s) => ({
          reflections: s.reflections.map((r) =>
            r.id === existing.id ? { ...r, content, categories } : r
          ),
        }))
      } catch {
        set({ error: 'Failed to update reflection' })
        useErrorStore.getState().push('database')
      }
    } else {
      try {
        const reflection: Reflection = {
          id: crypto.randomUUID(),
          weekStart,
          content,
          categories,
          createdAt: Date.now(),
        }
        await retryWithBackoff(() => db.reflections.add(reflection))
        queueWrite('upsert', 'reflections', reflection.id, reflection, db)
        set((s) => ({ reflections: [reflection, ...s.reflections] }))
      } catch {
        set({ error: 'Failed to save reflection' })
        useErrorStore.getState().push('database')
      }
    }
  },

  deleteReflection: async (id: string) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      await retryWithBackoff(() => db.reflections.delete(id))
      queueWrite('delete', 'reflections', id, {}, db)
      set((s) => ({ reflections: s.reflections.filter((r) => r.id !== id) }))
    } catch {
      set({ error: 'Failed to delete reflection' })
      useErrorStore.getState().push('database')
    }
  },
}))
