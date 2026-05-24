'use client'

import { useMemo } from 'react'
import type { Task } from '@/types'
import { analyzeDay, getRecentHistory } from '@/lib/softIntelligence'

interface DayPulseProps {
  tasks: Task[]
  date: string
  allTasks?: Task[]
}

export function DayPulse({ tasks, date, allTasks }: DayPulseProps) {
  const pulse = useMemo(() => {
    const sourceTasks = allTasks || tasks
    const history = getRecentHistory(sourceTasks)
    return analyzeDay(tasks, date, history)
  }, [tasks, date, allTasks])

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
