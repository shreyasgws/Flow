'use client'

import { useState, useEffect, useRef } from 'react'
import { getDb } from '@/lib/db'
import { useAuthStore } from '@/stores/authStore'
import { TimelineMonth } from '@/components/history/TimelineMonth'
import { TimelineDay } from '@/components/history/TimelineDay'
import type { Task, FlowSection, DriftEntry, Reflection } from '@/types'

const DAYS_PER_BATCH = 60

function formatMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function getDateRange(startDay: number, count: number): string[] {
  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() - startDay)
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() - 1)
  }
  return dates
}

interface DayData {
  tasks: Task[]
  sections: FlowSection[]
  drift: DriftEntry[]
  reflection: Reflection | null
}

export default function History() {
  const [days, setDays] = useState<Map<string, DayData>>(new Map())
  const [loadedDays, setLoadedDays] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  async function loadBatch(startFrom: number) {
    setIsLoading(true)
    const dates = getDateRange(startFrom, DAYS_PER_BATCH)

    const { user } = useAuthStore.getState()
    const _db = getDb(user?.id, user?.is_anonymous === true)
    const [allTasks, allSections, allDrift, allReflections] = await Promise.all([
      _db.tasks.where('date').anyOf(dates).toArray(),
      _db.flowSections.toArray(),
      _db.driftEntries.toArray(),
      _db.reflections.toArray(),
    ])

    setDays((prev) => {
      const updated = new Map(prev)
      let actualCount = 0

      for (const date of dates) {
        const dayTasks = allTasks.filter((t) => t.date === date)
        const daySections = allSections.filter((s) => {
          const sd = new Date(s.createdAt).toISOString().slice(0, 10)
          return sd === date
        })
        const dayDrift = allDrift.filter((e) => {
          const ed = new Date(e.createdAt).toISOString().slice(0, 10)
          return ed === date
        })
        const dayReflection = allReflections.find((r) => {
          const weekEnd = new Date(r.weekStart)
          weekEnd.setDate(weekEnd.getDate() + 7)
          return date >= r.weekStart && date < weekEnd.toISOString().slice(0, 10)
        }) ?? null

        if (dayTasks.length > 0 || daySections.length > 0 || dayDrift.length > 0 || dayReflection) {
          actualCount++
        }

        if (dayTasks.length > 0 || daySections.length > 0 || dayDrift.length > 0) {
          dayTasks.sort((a, b) => a.sortOrder - b.sortOrder)
          daySections.sort((a, b) => a.sortOrder - b.sortOrder)
          dayDrift.sort((a, b) => b.createdAt - a.createdAt)
        }

        if (!updated.has(date)) {
          updated.set(date, { tasks: dayTasks, sections: daySections, drift: dayDrift, reflection: dayReflection })
        }
      }

      if (actualCount < DAYS_PER_BATCH) setHasMore(false)
      return updated
    })

    setLoadedDays((prev) => prev + dates.length)
    setIsLoading(false)
  }

  useEffect(() => {
    // Initialize data loading
    loadBatch(0)
  }, [])

  useEffect(() => {
    if (!loaderRef.current || !hasMore || isLoading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadBatch(loadedDays)
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loadedDays, hasMore, isLoading])

  const sortedDates = [...days.keys()].sort().reverse()
  const groupedByMonth: { month: string; dates: string[] }[] = []
  for (const date of sortedDates) {
    const month = formatMonthKey(date)
    const lastGroup = groupedByMonth[groupedByMonth.length - 1]
    if (lastGroup && lastGroup.month === month) {
      lastGroup.dates.push(date)
    } else {
      groupedByMonth.push({ month, dates: [date] })
    }
  }

  return (
    <div className="px-4 pb-24 pt-2">
      <header className="mb-6 mt-2">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">History</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Your days in flow</p>
      </header>

      {groupedByMonth.length === 0 && !isLoading && (
        <p className="pt-12 text-center text-sm text-[var(--text-ghost)]">No history yet.</p>
      )}

      {groupedByMonth.map((group) => (
        <TimelineMonth key={group.month} label={group.month}>
          {group.dates.map((date) => {
            const data = days.get(date)
            if (!data) return null
            return (
              <TimelineDay
                key={date}
                date={date}
                tasks={data.tasks}
                sections={data.sections}
                drift={data.drift}
                reflection={data.reflection}
              />
            )
          })}
        </TimelineMonth>
      ))}

      <div ref={loaderRef} className="h-8">
        {isLoading && (
          <p className="pt-4 text-center text-xs text-[var(--text-ghost)]">Loading...</p>
        )}
        {!hasMore && (
          <p className="pt-4 text-center text-xs text-[var(--text-ghost)]">Beginning of your journey</p>
        )}
      </div>
    </div>
  )
}
