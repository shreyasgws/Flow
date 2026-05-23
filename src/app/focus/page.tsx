'use client'

import { useFocusStore } from '@/stores/focusStore'
import { useTaskStore } from '@/stores/taskStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FocusTab() {
  const activeTaskId = useFocusStore((s) => s.activeTaskId)
  const tasks = useTaskStore((s) => s.tasks)
  const loadTasks = useTaskStore((s) => s.loadTasks)
  const enterFocus = useFocusStore((s) => s.enterFocus)
  const router = useRouter()

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    loadTasks(today)
  }, [loadTasks])

  useEffect(() => {
    if (activeTaskId) {
      router.replace(`/focus/${activeTaskId}`)
    }
  }, [activeTaskId, router])

  const activeTasks = tasks.filter((t) => t.status === 'active')

  function handleStartFocus(taskId: string) {
    enterFocus(taskId)
    router.push(`/focus/${taskId}`)
  }

  return (
    <div className="px-4 pt-8">
      <h1 className="mb-2 font-serif text-2xl tracking-tight text-[var(--text-primary)]">
        Focus
      </h1>
      <p className="mb-8 text-xs text-[var(--text-muted)]">
        Pick a task to focus on.
      </p>

      {activeTasks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No active tasks waiting.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Plan something first.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activeTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleStartFocus(task.id)}
              className="w-full rounded-lg bg-[var(--bg-surface)] px-4 py-3 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              {task.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
