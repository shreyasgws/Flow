import { create } from 'zustand'
import { db } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
import type { Task } from '@/types'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  loadTasks: (date: string) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<Task | null>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  reorderTask: (id: string, sortOrder: number, flowSectionId: string) => Promise<void>
  batchReorder: (updates: { id: string; sortOrder: number; flowSectionId: string }[]) => Promise<void>
  getTasksForDate: (date: string) => Task[]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async (date: string) => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await db.tasks.where({ date }).toArray()
      tasks.sort((a, b) => a.sortOrder - b.sortOrder)
      set({ tasks, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load tasks' })
    }
  },

  addTask: async (partial) => {
    set({ error: null })
    const task: Task = {
      ...partial,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: Date.now(),
    }
    try {
      await db.tasks.add(task)
      set((s) => ({ tasks: [...s.tasks, task] }))
      return task
    } catch (err) {
      set({ error: 'Failed to add task' })
      return null
    }
  },

  uncompleteTask: async (id: string) => {
    set({ error: null })
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    try {
      await db.tasks.update(id, { status: 'active', completedAt: null })
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status: 'active' as const, completedAt: null } : t
        ),
      }))
      pushUndo(id, `Uncompleted "${task.title}"`, async () => {
        await db.tasks.update(id, { status: 'completed', completedAt: Date.now() })
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as const, completedAt: Date.now() } : t
          ),
        }))
      })
    } catch (err) {
      set({ error: 'Failed to uncomplete task' })
    }
  },

  completeTask: async (id: string) => {
    set({ error: null })
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const now = Date.now()
    try {
      await db.tasks.update(id, { status: 'completed', completedAt: now })
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status: 'completed' as const, completedAt: now } : t
        ),
      }))
      pushUndo(id, `Completed "${task.title}"`, async () => {
        await db.tasks.update(id, { status: 'active' as const, completedAt: null })
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'active' as const, completedAt: null } : t
          ),
        }))
      })
    } catch (err) {
      set({ error: 'Failed to complete task' })
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null })
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    try {
      await db.tasks.delete(id)
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      pushUndo(id, `Deleted "${task.title}"`, async () => {
        const restored = { ...task, id: crypto.randomUUID() }
        await db.tasks.add(restored)
        set((s) => ({
          tasks: [...s.tasks, restored].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch (err) {
      set({ error: 'Failed to delete task' })
    }
  },

  reorderTask: async (id: string, sortOrder: number, flowSectionId: string) => {
    set({ error: null })
    try {
      await db.tasks.update(id, { sortOrder, flowSectionId })
      set((s) => ({
        tasks: s.tasks
          .map((t) => (t.id === id ? { ...t, sortOrder, flowSectionId } : t))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
    } catch (err) {
      set({ error: 'Failed to reorder task' })
    }
  },

  batchReorder: async (updates) => {
    set({ error: null })
    try {
      await db.transaction('rw', db.tasks, async () => {
        for (const u of updates) {
          await db.tasks.update(u.id, { sortOrder: u.sortOrder, flowSectionId: u.flowSectionId })
        }
      })
      const ids = new Set(updates.map((u) => u.id))
      set((s) => ({
        tasks: s.tasks
          .map((t) => {
            const update = updates.find((u) => u.id === t.id)
            return update ? { ...t, sortOrder: update.sortOrder, flowSectionId: update.flowSectionId } : t
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
    } catch (err) {
      set({ error: 'Failed to reorder tasks' })
    }
  },

  getTasksForDate: (date: string) => {
    return get().tasks.filter((t) => t.date === date)
  },
}))
