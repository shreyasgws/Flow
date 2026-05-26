import { getDb } from '@/lib/db'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'
import type { Task } from '@/types'

function currentDb() {
  const state = useAuthStore.getState()
  return getDb(state.user?.id, state.user?.is_anonymous === true)
}

export async function shouldCreateNewInstance(task: Task, today: string): Promise<boolean> {
  if (!task.isRecurring || task.recurrenceType === 'none') return false
  if (task.status !== 'completed') return false

  const db = currentDb()

  if (task.recurrenceType === 'daily') {
    const existing = await db.tasks.where({ recurrenceBaseId: task.id, date: today }).toArray()
    if (existing.length > 0) return false
    return task.completedAt !== null
  }

  if (task.recurrenceType === 'weekdays') {
    const dayOfWeek = new Date(today + 'T12:00:00').getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    const existing = await db.tasks.where({ recurrenceBaseId: task.id, date: today }).toArray()
    if (existing.length > 0) return false
    return task.completedAt !== null
  }

  if (task.recurrenceType === 'weekly') {
    const dayOfWeek = new Date(today + 'T12:00:00').getDay()
    const baseDayOfWeek = new Date(task.createdAt).getDay()
    if (dayOfWeek !== baseDayOfWeek) return false
    const existing = await db.tasks.where({ recurrenceBaseId: task.id, date: today }).toArray()
    if (existing.length > 0) return false
    return task.completedAt !== null
  }

  return false
}

export async function createInstance(task: Task, date: string): Promise<Task | null> {
  if (!task.isRecurring) return null
  const db = currentDb()
  try {
    const instance: Task = {
      id: crypto.randomUUID(),
      title: task.title,
      status: 'active',
      flowSectionId: task.flowSectionId,
      categoryId: task.categoryId,
      date,
      sortOrder: task.sortOrder,
      estimatedMinutes: task.estimatedMinutes,
      frictionLevel: task.frictionLevel,
      focusWindowStart: null,
      focusWindowEnd: null,
      createdAt: Date.now(),
      completedAt: null,
      isRecurring: false,
      recurrenceType: 'none',
      recurrenceBaseId: task.id,
      sourceDriftId: null,
    }
    await db.tasks.add(instance)
    queueWrite('upsert', 'tasks', instance.id, instance, db)
    return instance
  } catch {
    return null
  }
}

export async function processRecurringTasks(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const db = currentDb()

  const baseTasks = await db.tasks
    .where({ isRecurring: true })
    .filter((t) => t.recurrenceType !== 'none')
    .toArray()

  let count = 0
  for (const task of baseTasks) {
    const shouldCreate = await shouldCreateNewInstance(task, today)
    if (shouldCreate) {
      const instance = await createInstance(task, today)
      if (instance) count++
    }
  }
  return count
}
