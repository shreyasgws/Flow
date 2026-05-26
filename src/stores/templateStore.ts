import { create } from 'zustand'
import { getDb } from '@/lib/db'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'
import type { Template, TemplateTask } from '@/types'

interface TemplateStore {
  templates: Template[]
  isLoading: boolean
  loadTemplates: () => Promise<void>
  addTemplate: (name: string, tasks: TemplateTask[]) => Promise<string | null>
  updateTemplate: (id: string, data: Partial<Pick<Template, 'name' | 'tasks' | 'sortOrder'>>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  reset: () => void
}

const initialState = {
  templates: [] as Template[],
  isLoading: false,
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  loadTemplates: async () => {
    set({ isLoading: true })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const items = await retryWithBackoff(() => db.templates.toArray())
      set({ templates: items.sort((a, b) => a.sortOrder - b.sortOrder), isLoading: false })
    } catch {
      set({ isLoading: false })
      useErrorStore.getState().push('database')
    }
  },

  addTemplate: async (name: string, tasks: TemplateTask[]) => {
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const count = await db.templates.count()
      if (count >= 30) return null
      const template: Template = {
        id: crypto.randomUUID(),
        name,
        tasks,
        sortOrder: count,
        createdAt: Date.now(),
      }
      await retryWithBackoff(() => db.templates.add(template))
      queueWrite('upsert', 'templates', template.id, template, db)
      set({ templates: [...get().templates, template].sort((a, b) => a.sortOrder - b.sortOrder) })
      return template.id
    } catch {
      useErrorStore.getState().push('database')
      return null
    }
  },

  updateTemplate: async (id: string, data: Partial<Pick<Template, 'name' | 'tasks' | 'sortOrder'>>) => {
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      await retryWithBackoff(() => db.templates.update(id, data))
      const prev = get().templates.find((t) => t.id === id)
      if (prev) queueWrite('upsert', 'templates', id, { ...prev, ...data }, db)
      set({
        templates: get().templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })
    } catch {
      useErrorStore.getState().push('database')
    }
  },

  deleteTemplate: async (id: string) => {
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      await retryWithBackoff(() => db.templates.delete(id))
      queueWrite('delete', 'templates', id, {}, db)
      set({ templates: get().templates.filter((t) => t.id !== id) })
    } catch {
      useErrorStore.getState().push('database')
    }
  },
}))
