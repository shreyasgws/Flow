'use client'

import { useMemo, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { CompletionRing } from '@/components/weekly/CompletionRing'
import { calculateDayWeight, getCompletionLabel } from '@/lib/dayWeight'
import type { Task } from '@/types'
import { EmptyReview } from '@/components/empty/EmptyReview'

function formatDate(dateStr: string): { display: string; dayName: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
  const display = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return { display, dayName }
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export default function DayReview({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = use(params)
  const allTasks = useTaskStore((s) => s.tasks)
  const sections = useFlowSectionStore((s) => s.sections)
  const [showCarryForward, setShowCarryForward] = useState(true)

  const { display } = formatDate(date)

  const dateTasks = useMemo(
    () => allTasks.filter((t) => t.date === date),
    [allTasks, date],
  )

  const completed = dateTasks.filter((t) => t.status === 'completed')
  const active = dateTasks.filter((t) => t.status === 'active')

  const totalMinutes = dateTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const completionRatio = dateTasks.length > 0 ? completed.length / dateTasks.length : 0

  const dayWeight = calculateDayWeight({
    taskCount: dateTasks.length,
    estimatedHours: totalMinutes / 60,
    completionRatio,
  })

  const completionLabel = getCompletionLabel(completed.length, dateTasks.length)

  const tasksBySection = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of dateTasks) {
      const secId = task.flowSectionId ?? '__unsorted__'
      if (!map.has(secId)) map.set(secId, [])
      map.get(secId)!.push(task)
    }
    return map
  }, [dateTasks])

  const today = isToday(date)

  return (
    <div className="px-4" style={{ opacity: dayWeight.opacity }}>
      <header className="mb-6 mt-2">
        <Link
          href="/weekly"
          className="mb-3 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M7 3L4 6l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to week
        </Link>
        <h1 className="font-serif text-xl text-[var(--text-primary)]">{display}</h1>
      </header>

      <div className="mb-6 flex items-center gap-6">
        <CompletionRing completed={completed.length} total={dateTasks.length} size={60} dayWeight={dayWeight.weight} />
        <div>
          <p className="font-serif text-base text-[var(--text-primary)]">
            {completionLabel}
          </p>
          {dateTasks.length > 0 && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {active.length > 0
                ? `${active.length} task${active.length > 1 ? 's' : ''} remaining`
                : 'The day feels quieter now.'}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <details className="group">
          <summary className="cursor-pointer text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]">
            How was your energy today?
          </summary>
          <div className="mt-3 flex gap-2">
            {['Low', 'Medium', 'High'].map((level) => (
              <button
                key={level}
                onClick={() => {}}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)] transition-colors hover:border-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-ghost)]">
            This is not stored — just a moment of awareness.
          </p>
        </details>
      </div>

      <div
        className="space-y-4"
        style={{
          '--section-density': dayWeight.density,
        } as React.CSSProperties}
      >
        {Array.from(tasksBySection.entries()).map(([secId, tasks]) => {
          const section = sections.find((s) => s.id === secId)
          const sectionName = section?.name ?? 'Unsorted'
          const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
          return (
            <div key={secId} className="border-l border-[var(--border)] pl-3">
              <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                {sectionName}
              </p>
              {sorted.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-2"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full border ${
                      task.status === 'completed'
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--text-ghost)]'
                    }`}
                    aria-hidden="true"
                  >
                    {task.status === 'completed' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      task.status === 'completed'
                        ? 'text-[var(--text-muted)] line-through'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.estimatedMinutes && (
                    <span className="text-[10px] text-[var(--text-ghost)]">
                      {task.estimatedMinutes}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {dateTasks.length === 0 && (
        <EmptyReview hasHistory={allTasks.length > dateTasks.length} />
      )}

      {today && active.length > 0 && showCarryForward && (
        <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <p className="text-sm text-[var(--text-primary)]">
            Move {active.length} unfinished task{active.length > 1 ? 's' : ''} to today?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {}}
              className="btn-primary"
            >
              Carry forward
            </button>
            <button
              onClick={() => setShowCarryForward(false)}
              className="btn-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
