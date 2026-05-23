'use client'

import { useMemo } from 'react'
import type { Task } from '@/types'

interface DayPulseProps {
  tasks: Task[]
  date: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function DayPulse({ tasks, date }: DayPulseProps) {
  const pulse = useMemo(() => {
    const active = tasks.filter((t) => t.status === 'active')
    const completed = tasks.filter((t) => t.status === 'completed')
    const total = tasks.length
    const totalCompleted = completed.length
    const totalMinutes = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
    const isToday = date === today()
    const hour = new Date().getHours()
    const isMorning = hour >= 4 && hour < 12
    const isAfternoon = hour >= 12 && hour < 17
    const isEvening = hour >= 17 && hour < 22
    const isNight = hour >= 22 || hour < 4
    const remainingMinutes = active.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)

    if (total === 0 && isToday) {
      return { line1: 'Nothing planned yet.', line2: 'Keep today simple.' }
    }
    if (total === 0 && !isToday) {
      return { line1: 'Nothing was planned this day.', line2: 'That is fine.' }
    }
    if (totalCompleted === total && total > 0) {
      return { line1: 'All done for today.', line2: `${totalCompleted} tasks completed.` }
    }
    if (isMorning && totalCompleted > 0) {
      return { line1: 'Good morning.', line2: `You already completed ${totalCompleted} thing${totalCompleted > 1 ? 's' : ''}.` }
    }
    if (isMorning && totalCompleted === 0) {
      return { line1: 'Good morning.', line2: `Ahead of you: ${active.length} task${active.length > 1 ? 's' : ''}.` }
    }
    if (isAfternoon) {
      if (remainingMinutes >= 180) {
        return { line1: 'Heavy afternoon ahead.', line2: 'Start with something light.' }
      }
      return { line1: 'Afternoon momentum.', line2: `${active.length} task${active.length > 1 ? 's' : ''} remaining.` }
    }
    if (isEvening) {
      return { line1: 'Good evening.', line2: `${active.length} thing${active.length > 1 ? 's' : ''} left.` }
    }
    if (isNight) {
      return { line1: 'Still going.', line2: `${active.length} left. Rest when you need to.` }
    }
    return { line1: 'Your day in flow.', line2: `${active.length} active, ${totalCompleted} done.` }
  }, [tasks, date])

  return (
    <div className="mb-4">
      <p className="font-serif text-xl font-light text-[var(--text-primary)]">
        {pulse.line1}
      </p>
      <p className="font-serif text-base font-light text-[var(--text-secondary)]">
        {pulse.line2}
      </p>
    </div>
  )
}
