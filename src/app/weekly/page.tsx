'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useReflectionStore } from '@/stores/reflectionStore'
import { useDriftStore } from '@/stores/driftStore'
import { DayCard } from '@/components/weekly/DayCard'
import { WeekReflection } from '@/components/weekly/WeekReflection'
import { getCompactCompletionLabel } from '@/lib/dayWeight'

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function getWeekDates(weekStart: string): { date: string; dayName: string; dateNumber: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const start = new Date(weekStart + 'T00:00:00')
  return days.map((name, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      dayName: name,
      dateNumber: d.getDate(),
    }
  })
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Weekly() {
  const router = useRouter()
  const allTasks = useTaskStore((s) => s.tasks)
  const loadTasks = useTaskStore((s) => s.loadTasks)
  const loadSections = useFlowSectionStore((s) => s.loadSections)
  const loadReflections = useReflectionStore((s) => s.loadReflections)
  const loadDrift = useDriftStore((s) => s.loadEntries)
  const getReflectionForWeek = useReflectionStore((s) => s.getReflectionForWeek)
  const saveReflection = useReflectionStore((s) => s.saveReflection)
  const [dismissedWeeks, setDismissedWeeks] = useState<Set<string>>(new Set())
  function isPromptDismissed(ws: string) { return dismissedWeeks.has(ws) }
  function dismissPrompt(ws: string) { setDismissedWeeks((prev) => new Set(prev).add(ws)) }

  const today = new Date().toISOString().slice(0, 10)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  useEffect(() => {
    loadTasks(today)
    loadSections()
    loadReflections()
    loadDrift()
  }, [loadTasks, loadSections, loadReflections, loadDrift, today])

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  const dayStats = useMemo(() => {
    return weekDates.map(({ date }) => {
      const dayTasks = allTasks.filter((t) => t.date === date)
      const completed = dayTasks.filter((t) => t.status === 'completed').length
      const total = dayTasks.length
      return { date, completed, total, label: getCompactCompletionLabel(completed, total) }
    })
  }, [weekDates, allTasks])

  function navigateWeek(offset: number) {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + offset * 7)
    setWeekStart(getWeekStart(d))
  }

  function handleNavigateToDate(date: string) {
    router.push(`/review/${date}`)
  }

  const weekTotalTasks = useMemo(() => {
    return dayStats.reduce((s, d) => s + d.total, 0)
  }, [dayStats])

  const weekCompletedTasks = useMemo(() => {
    return dayStats.reduce((s, d) => s + d.completed, 0)
  }, [dayStats])

  const existingReflection = getReflectionForWeek(weekStart)
  const showReflectionPrompt = !existingReflection && !isPromptDismissed(weekStart)

  const [promptContent, setPromptContent] = useState('')
  const [promptSaving, setPromptSaving] = useState(false)

  const handlePromptSave = useCallback(async () => {
    if (!promptContent.trim()) {
      dismissPrompt(weekStart)
      return
    }
    setPromptSaving(true)
    try {
      await saveReflection(weekStart, promptContent.trim(), [])
      dismissPrompt(weekStart)
    } finally {
      setPromptSaving(false)
    }
  }, [promptContent, weekStart, saveReflection])

  function handleDismissPrompt() {
    dismissPrompt(weekStart)
  }

  return (
    <div className="px-4">
      <header className="mb-6 mt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            aria-label="Previous week"
            className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M8 4L5 7l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="font-serif text-xl text-[var(--text-primary)]">
              {formatMonthYear(weekStart)}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              A memory of your week. Not analytics. Not a dashboard.
            </p>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            aria-label="Next week"
            className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {dayStats.map((stat) => {
          const dayInfo = weekDates.find((d) => d.date === stat.date)!
          const isToday = stat.date === today
          const isFuture = stat.date > today
          return (
            <DayCard
              key={stat.date}
              date={stat.date}
              dayName={dayInfo.dayName}
              dateNumber={dayInfo.dateNumber}
              completed={stat.completed}
              total={stat.total}
              isToday={isToday}
              isFuture={isFuture}
              onClick={() => handleNavigateToDate(stat.date)}
            />
          )
        })}
      </div>

      {weekTotalTasks > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {weekCompletedTasks}/{weekTotalTasks} tasks across this week
          </p>
        </div>
      )}

      <AnimatePresence>
        {showReflectionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mt-6 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-4"
          >
            <p className="mb-2 font-serif text-base text-[var(--text-primary)]">
              How did this week feel?
            </p>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder="No pressure — just a thought if you want to leave one..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent)] focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handlePromptSave}
                disabled={promptSaving}
                className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {promptSaving ? 'Saving...' : promptContent.trim() ? 'Save reflection' : 'Skip'}
              </button>
              <button
                onClick={handleDismissPrompt}
                className="rounded-full border border-[var(--bg-elevated)] px-4 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--text-ghost)]"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WeekReflection weekStart={weekStart} />
    </div>
  )
}
