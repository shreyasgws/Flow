import { db } from '@/lib/db'
import type { Task } from '@/types'

export function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function getUnfinishedYesterday(): Promise<Task[]> {
  const yesterday = getYesterday()
  const allTasks = await db.tasks.where({ date: yesterday }).toArray()
  return allTasks.filter((t) => t.status === 'active' && !t.isRecurring)
}

export async function carryForwardTasks(taskIds: string[]): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  let count = 0

  for (const id of taskIds) {
    const task = await db.tasks.get(id)
    if (!task || task.isRecurring) continue

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: task.title,
      status: 'active',
      flowSectionId: task.flowSectionId,
      categoryId: task.categoryId,
      date: today,
      sortOrder: task.sortOrder,
      estimatedMinutes: task.estimatedMinutes,
      frictionLevel: task.frictionLevel,
      focusWindowStart: null,
      focusWindowEnd: null,
      createdAt: Date.now(),
      completedAt: null,
      isRecurring: false,
      recurrenceType: 'none',
      recurrenceBaseId: null,
      sourceDriftId: null,
    }

    await db.tasks.add(newTask)
    count++
  }

  return count
}
