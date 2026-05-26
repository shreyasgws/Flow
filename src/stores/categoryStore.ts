import { create } from 'zustand'
import type { Category } from '@/types'
import { getDb } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'

const PRESET_COLORS = [
  '#E05454', '#E08054', '#E0B054', '#8AB854',
  '#54B880', '#54B8B8', '#5488E0', '#8854E0',
  '#C054C0', '#E05488', '#808080', '#505050',
]

interface CategoryStore {
  categories: Category[]
  isLoading: boolean
  error: string | null
  loadCategories: () => Promise<void>
  addCategory: (name: string, color: string, emoji?: string) => Promise<Category | null>
  updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'color' | 'emoji'>>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  reorderCategories: (updates: { id: string; sortOrder: number }[]) => Promise<void>
  reset: () => void
}

const initialState = {
  categories: [] as Category[],
  isLoading: false,
  error: null as string | null,
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  loadCategories: async () => {
    set({ isLoading: true, error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const categories = await retryWithBackoff(() => db.categories.toArray())
      categories.sort((a, b) => a.sortOrder - b.sortOrder)
      set({ categories, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load categories' })
      useErrorStore.getState().push('database')
    }
  },

  addCategory: async (name, color, emoji) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const maxOrder = get().categories.reduce((m, c) => Math.max(m, c.sortOrder), -1)
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      color,
      emoji: emoji ?? null,
      sortOrder: maxOrder + 1,
      createdAt: Date.now(),
    }
    try {
      await retryWithBackoff(() => db.categories.add(category))
      queueWrite('upsert', 'categories', category.id, category, db)
      set((s) => ({ categories: [...s.categories, category] }))
      return category
    } catch {
      set({ error: 'Failed to add category' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t create category', description: 'Try again.' })
      return null
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const prev = get().categories.find((c) => c.id === id)
    if (!prev) return
    try {
      await retryWithBackoff(() => db.categories.update(id, data))
      queueWrite('upsert', 'categories', id, { ...prev, ...data }, db)
      set((s) => ({
        categories: s.categories.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      }))
      pushUndo(id, `Updated category "${prev.name}"`, async () => {
        const revert = Object.fromEntries(Object.keys(data).map((k) => [k, (prev as unknown as Record<string, unknown>)[k]]))
        await retryWithBackoff(() => db.categories.update(id, revert))
        queueWrite('upsert', 'categories', id, prev, db)
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...revert } : c
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to update category' })
      useErrorStore.getState().push('database')
    }
  },

  deleteCategory: async (id) => {
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const category = get().categories.find((c) => c.id === id)
    if (!category) return
    try {
      await retryWithBackoff(() => db.categories.delete(id))
      queueWrite('delete', 'categories', id, {}, db)
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
      pushUndo(id, `Deleted category "${category.name}"`, async () => {
        const restored = { ...category, id: crypto.randomUUID() }
        await retryWithBackoff(() => db.categories.add(restored))
        queueWrite('upsert', 'categories', restored.id, restored, db)
        set((s) => ({
          categories: [...s.categories, restored].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to delete category' })
      useErrorStore.getState().push('database')
    }
  },

  reorderCategories: async (updates) => {
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const prevStates = updates.map((u) => {
      const c = get().categories.find((cat) => cat.id === u.id)
      return c ? { id: c.id, sortOrder: c.sortOrder } : null
    }).filter(Boolean) as { id: string; sortOrder: number }[]
    try {
      await retryWithBackoff(() => db.transaction('rw', db.categories, async () => {
        for (const u of updates) {
          await db.categories.update(u.id, { sortOrder: u.sortOrder })
          const cat = get().categories.find((c) => c.id === u.id)
          if (cat) queueWrite('upsert', 'categories', u.id, { ...cat, sortOrder: u.sortOrder }, db)
        }
      }))
      set((s) => ({
        categories: s.categories
          .map((c) => {
            const update = updates.find((u) => u.id === c.id)
            return update ? { ...c, sortOrder: update.sortOrder } : c
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      pushUndo(`batch-cat-${Date.now()}`, 'Reordered categories', async () => {
        await retryWithBackoff(() => db.transaction('rw', db.categories, async () => {
          for (const p of prevStates) {
            await db.categories.update(p.id, { sortOrder: p.sortOrder })
            const cat = get().categories.find((c) => c.id === p.id)
            if (cat) queueWrite('upsert', 'categories', p.id, { ...cat, sortOrder: p.sortOrder }, db)
          }
        }))
      })
    } catch {
      set({ error: 'Failed to reorder categories' })
      useErrorStore.getState().push('database')
    }
  },
}))

export { PRESET_COLORS }
