import { create } from 'zustand'
import { getDb } from '@/lib/db'
import { pushUndo } from '@/lib/undo'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'
import type { Task } from '@/types'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  loadTasks: (date: string) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'categoryId'>) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Pick<Task, 'title' | 'categoryId' | 'estimatedMinutes' | 'frictionLevel' | 'focusWindowStart' | 'focusWindowEnd'>>) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  reorderTask: (id: string, sortOrder: number, flowSectionId: string) => Promise<void>
  batchReorder: (updates: { id: string; sortOrder: number; flowSectionId: string }[]) => Promise<void>
  clearCompleted: () => Promise<void>
  getTasksForDate: (date: string) => Task[]
  reset: () => void
}

const initialState = {
  tasks: [] as Task[],
  isLoading: false,
  error: null as string | null,
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  loadTasks: async (date: string) => {
    set({ isLoading: true, error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const tasks = await retryWithBackoff(() => db.tasks.where({ date }).toArray())
      tasks.sort((a, b) => a.sortOrder - b.sortOrder)
      set({ tasks, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load tasks' })
      useErrorStore.getState().push('database')
    }
  },

  addTask: async (partial) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const task: Task = {
      ...partial,
      id: crypto.randomUUID(),
      status: 'active',
      categoryId: null,
      createdAt: Date.now(),
    }
    try {
      await retryWithBackoff(() => db.tasks.add(task))
      queueWrite('upsert', 'tasks', task.id, task, db)
      set((s) => ({ tasks: [...s.tasks, task] }))
      return task
    } catch {
      set({ error: 'Failed to add task' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t save that task', description: 'Your task is kept locally. Try again.' })
      return null
    }
  },

  updateTask: async (id, data) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const prev = get().tasks.find((t) => t.id === id)
    if (!prev) return
    try {
      await retryWithBackoff(() => db.tasks.update(id, data))
      const updated = { ...prev, ...data }
      queueWrite('upsert', 'tasks', id, updated, db)
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? updated : t
        ),
      }))
      const label = data.title ? `Renamed "${prev.title}"` : `Updated task`
      pushUndo(id, label, async () => {
        const revert = Object.fromEntries(Object.keys(data).map((k) => [k, (prev as unknown as Record<string, unknown>)[k]]))
        await retryWithBackoff(() => db.tasks.update(id, revert))
        queueWrite('upsert', 'tasks', id, prev, db)
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...revert } : t
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to update task' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t update', description: 'Try again.' })
    }
  },

  uncompleteTask: async (id: string) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    try {
      await retryWithBackoff(() => db.tasks.update(id, { status: 'active', completedAt: null }))
      queueWrite('upsert', 'tasks', id, { ...task, status: 'active', completedAt: null }, db)
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status: 'active' as const, completedAt: null } : t
        ),
      }))
      pushUndo(id, `Uncompleted "${task.title}"`, async () => {
        await retryWithBackoff(() => db.tasks.update(id, { status: 'completed', completedAt: Date.now() }))
        queueWrite('upsert', 'tasks', id, { ...task, status: 'completed', completedAt: Date.now() }, db)
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as const, completedAt: Date.now() } : t
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to uncomplete task' })
      useErrorStore.getState().push('database')
    }
  },

  completeTask: async (id: string) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const now = Date.now()
    try {
      await retryWithBackoff(() => db.tasks.update(id, { status: 'completed', completedAt: now }))
      queueWrite('upsert', 'tasks', id, { ...task, status: 'completed', completedAt: now }, db)
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status: 'completed' as const, completedAt: now } : t
        ),
      }))
      pushUndo(id, `Completed "${task.title}"`, async () => {
        await retryWithBackoff(() => db.tasks.update(id, { status: 'active' as const, completedAt: null }))
        queueWrite('upsert', 'tasks', id, { ...task, status: 'active', completedAt: null }, db)
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'active' as const, completedAt: null } : t
          ),
        }))
      })
    } catch {
      set({ error: 'Failed to complete task' })
      useErrorStore.getState().push('database')
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    try {
      await retryWithBackoff(() => db.tasks.delete(id))
      queueWrite('delete', 'tasks', id, {}, db)
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      pushUndo(id, `Deleted "${task.title}"`, async () => {
        const restored = { ...task, id: crypto.randomUUID() }
        await retryWithBackoff(() => db.tasks.add(restored))
        queueWrite('upsert', 'tasks', restored.id, restored, db)
        set((s) => ({
          tasks: [...s.tasks, restored].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to delete task' })
      useErrorStore.getState().push('database')
    }
  },

  reorderTask: async (id: string, sortOrder: number, flowSectionId: string) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const prev = get().tasks.find((t) => t.id === id)
    if (!prev) return
    try {
      await retryWithBackoff(() => db.tasks.update(id, { sortOrder, flowSectionId }))
      queueWrite('upsert', 'tasks', id, { ...prev, sortOrder, flowSectionId }, db)
      set((s) => ({
        tasks: s.tasks
          .map((t) => (t.id === id ? { ...t, sortOrder, flowSectionId } : t))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      pushUndo(id, `Moved "${prev.title}"`, async () => {
        await retryWithBackoff(() => db.tasks.update(id, { sortOrder: prev.sortOrder, flowSectionId: prev.flowSectionId }))
        queueWrite('upsert', 'tasks', id, prev, db)
        set((s) => ({
          tasks: s.tasks
            .map((t) => (t.id === id ? { ...t, sortOrder: prev.sortOrder, flowSectionId: prev.flowSectionId } : t))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to reorder task' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t reorder', description: 'The order may not have saved. Try again.' })
    }
  },

  batchReorder: async (updates) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    const prevStates = updates.map((u) => {
      const t = get().tasks.find((task) => task.id === u.id)
      return t ? { id: t.id, sortOrder: t.sortOrder, flowSectionId: t.flowSectionId } : null
    }).filter(Boolean) as { id: string; sortOrder: number; flowSectionId: string }[]
    try {
      await retryWithBackoff(() => db.transaction('rw', db.tasks, async () => {
        for (const u of updates) {
          await db.tasks.update(u.id, { sortOrder: u.sortOrder, flowSectionId: u.flowSectionId })
          const task = get().tasks.find((t) => t.id === u.id)
          if (task) {
            queueWrite('upsert', 'tasks', u.id, { ...task, sortOrder: u.sortOrder, flowSectionId: u.flowSectionId }, db)
          }
        }
      }))
      set((s) => ({
        tasks: s.tasks
          .map((t) => {
            const update = updates.find((u) => u.id === t.id)
            return update ? { ...t, sortOrder: update.sortOrder, flowSectionId: update.flowSectionId } : t
          })
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      pushUndo(`batch-${Date.now()}`, `Reordered tasks`, async () => {
        await retryWithBackoff(() => db.transaction('rw', db.tasks, async () => {
          for (const p of prevStates) {
            await db.tasks.update(p.id, { sortOrder: p.sortOrder, flowSectionId: p.flowSectionId })
            const task = get().tasks.find((t) => t.id === p.id)
            if (task) {
              queueWrite('upsert', 'tasks', p.id, { ...task, sortOrder: p.sortOrder, flowSectionId: p.flowSectionId }, db)
            }
          }
        }))
        set((s) => ({
          tasks: s.tasks.map((t) => {
            const prev = prevStates.find((p) => p.id === t.id)
            return prev ? { ...t, sortOrder: prev.sortOrder, flowSectionId: prev.flowSectionId } : t
          }).sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to reorder tasks' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t reorder', description: 'The order may not have saved. Try again.' })
    }
  },

  clearCompleted: async () => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const allCompleted = await retryWithBackoff(() =>
        db.tasks.where('status').equals('completed').toArray(),
      )
      if (allCompleted.length === 0) return
      const ids = allCompleted.map((t) => t.id)
      await retryWithBackoff(() => db.tasks.bulkDelete(ids))
      for (const task of allCompleted) {
        queueWrite('delete', 'tasks', task.id, {}, db)
      }
      set((s) => ({ tasks: s.tasks.filter((t) => t.status !== 'completed') }))
      pushUndo(`clear-${Date.now()}`, `Cleared ${allCompleted.length} completed tasks`, async () => {
        await retryWithBackoff(() => db.tasks.bulkAdd(allCompleted))
        for (const task of allCompleted) {
          queueWrite('upsert', 'tasks', task.id, task, db)
        }
        set((s) => ({
          tasks: [...s.tasks, ...allCompleted].sort((a, b) => a.sortOrder - b.sortOrder),
        }))
      })
    } catch {
      set({ error: 'Failed to clear completed tasks' })
      useErrorStore.getState().push('database', { message: 'Couldn\'t clear', description: 'Try again.' })
    }
  },

  getTasksForDate: (date: string) => {
    return get().tasks.filter((t) => t.date === date)
  },
}))
