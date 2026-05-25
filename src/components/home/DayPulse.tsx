'use client'

import { useMemo } from 'react'
import type { Task, FlowSection, DriftEntry } from '@/types'
import { analyzeDay, getRecentHistory } from '@/lib/softIntelligence'

interface DayPulseProps {
  tasks: Task[]
  date: string
  allTasks?: Task[]
  sections?: FlowSection[]
  drift?: DriftEntry[]
}

export function DayPulse({ tasks, date, allTasks, sections, drift }: DayPulseProps) {
  const pulse = useMemo(() => {
    const sourceTasks = allTasks || tasks
    const history = getRecentHistory(sourceTasks)
    return analyzeDay(tasks, date, history, sections, drift)
  }, [tasks, date, allTasks, sections, drift])

  return (
    <div className="mb-4">
      <p className="font-serif text-xl font-light text-[var(--text-primary)]">
        {pulse.line1}
      </p>
      <p className="font-serif text-base font-light text-[var(--text-secondary)]">
        {pulse.line2}
      </p>
      {pulse.insight && (
        <p className="mt-1 font-serif text-sm font-light italic text-[var(--text-muted)]">
          {pulse.insight}
        </p>
      )}
    </div>
  )
}
