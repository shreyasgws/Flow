import { create } from 'zustand'
import { db } from '@/lib/db'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import type { Template, TemplateTask } from '@/types'

interface TemplateStore {
  templates: Template[]
  isLoading: boolean
  loadTemplates: () => Promise<void>
  addTemplate: (name: string, tasks: TemplateTask[]) => Promise<string | null>
  updateTemplate: (id: string, data: Partial<Pick<Template, 'name' | 'tasks' | 'sortOrder'>>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true })
    try {
      const items = await retryWithBackoff(() => db.templates.toArray())
      set({ templates: items.sort((a, b) => a.sortOrder - b.sortOrder), isLoading: false })
    } catch {
      set({ isLoading: false })
      useErrorStore.getState().push('database')
    }
  },

  addTemplate: async (name: string, tasks: TemplateTask[]) => {
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
      set({ templates: [...get().templates, template].sort((a, b) => a.sortOrder - b.sortOrder) })
      return template.id
    } catch {
      useErrorStore.getState().push('database')
      return null
    }
  },

  updateTemplate: async (id: string, data: Partial<Pick<Template, 'name' | 'tasks' | 'sortOrder'>>) => {
    try {
      await retryWithBackoff(() => db.templates.update(id, data))
      set({
        templates: get().templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })
    } catch {
      useErrorStore.getState().push('database')
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      await retryWithBackoff(() => db.templates.delete(id))
      set({ templates: get().templates.filter((t) => t.id !== id) })
    } catch {
      useErrorStore.getState().push('database')
    }
  },
}))
