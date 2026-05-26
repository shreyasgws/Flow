'use client'

import { motion } from 'motion/react'
import type { Task, FlowSection, DriftEntry, Reflection } from '@/types'

interface TimelineDayProps {
  date: string
  tasks: Task[]
  sections: FlowSection[]
  drift: DriftEntry[]
  reflection: Reflection | null
}

function formatDayHeader(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10)
  if (dateStr === fmt(today)) return 'Today'
  if (dateStr === fmt(yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function TimelineDay({ date, tasks, sections, drift, reflection }: TimelineDayProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const activeTasks = tasks.filter((t) => t.status === 'active')
  const hasContent = sections.length > 0 || tasks.length > 0 || drift.length > 0 || reflection

  if (!hasContent) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <h3 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">{formatDayHeader(date)}</h3>

      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.atmosphereColor }} />
            <span className="text-sm text-[var(--text-primary)]">{s.name}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{s.startTime}–{s.endTime}</span>
            {s.energyType && (
              <span className="ml-auto rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-[9px] text-[var(--text-muted)]">
                {s.energyType.replace('_', ' ')}
              </span>
            )}
          </div>
        ))}

        {activeTasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            <span className="h-3 w-3 shrink-0 rounded-full border border-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-primary)]">{t.title}</span>
            {t.estimatedMinutes && (
              <span className="text-[10px] text-[var(--text-ghost)]">{t.estimatedMinutes}m</span>
            )}
          </div>
        ))}

        {completedTasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
              <svg width="6" height="6" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm text-[var(--text-muted)] line-through">{t.title}</span>
          </div>
        ))}

        {drift.map((e) => (
          <div key={e.id} className="flex items-start gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--text-ghost)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text-primary)]">{e.text}</p>
            </div>
          </div>
        ))}

        {reflection && (
          <div className="rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            <p className="text-xs text-[var(--text-muted)]">Reflection</p>
            <p className="mt-1 text-sm text-[var(--text-primary)] line-clamp-2">{reflection.content}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
