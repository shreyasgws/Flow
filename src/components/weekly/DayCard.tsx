'use client'

import { motion } from 'motion/react'
import { getCompactCompletionLabel } from '@/lib/dayWeight'

interface DayCardProps {
  date: string
  dayName: string
  dateNumber: number
  completed: number
  total: number
  isToday: boolean
  isFuture: boolean
  onClick: () => void
}

export function DayCard({ dayName, dateNumber, completed, total, isToday, isFuture, onClick }: DayCardProps) {
  const ratio = total > 0 ? completed / total : 0
  const label = total > 0 ? getCompactCompletionLabel(completed, total) : 'empty'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 min-w-[52px] transition-colors ${
        isToday
          ? 'border border-[var(--accent)]/40 bg-[var(--accent)]/5'
          : 'hover:bg-[var(--bg-elevated)]'
      }`}
      aria-label={`${dayName} ${dateNumber} — ${label}`}
    >
      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{dayName}</span>
      <span
        className={`text-sm font-medium ${
          isFuture
            ? 'text-[var(--text-ghost)]'
            : total === 0
              ? 'text-[var(--text-ghost)]'
              : 'text-[var(--text-primary)]'
        }`}
      >
        {dateNumber}
      </span>

      {!isFuture && total > 0 && (
        <div className="mt-1 h-[2px] w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      <span
        className={`text-[10px] ${
          label === 'full'
            ? 'text-[var(--accent)]'
            : label === 'empty'
              ? 'text-[var(--text-ghost)]'
              : 'text-[var(--text-muted)]'
        }`}
      >
        {label}
      </span>
    </motion.button>
  )
}
