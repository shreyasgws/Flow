'use client'

import { useMemo } from 'react'

interface DateStripProps {
  selectedDate: string
  onSelectDate: (date: string) => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const todayDate = new Date(today() + 'T12:00:00')
  const diff = Math.round((d.getTime() - todayDate.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
  const dates = useMemo(() => {
    const todayDate = new Date(today() + 'T12:00:00')
    const result: string[] = []
    for (let i = -7; i <= 7; i++) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() + i)
      result.push(d.toISOString().slice(0, 10))
    }
    return result
  }, [])

  const selectedIndex = dates.indexOf(selectedDate)

  return (
    <div className="mb-4 overflow-x-auto scrollbar-none">
      <div className="flex gap-2 pb-1">
        {dates.map((dateStr) => {
          const isToday = dateStr === today()
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`shrink-0 rounded-lg px-3 py-2 text-center text-[11px] transition-all ${
                isSelected
                  ? 'bg-[var(--accent)] text-white'
                  : isToday
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {formatDateLabel(dateStr)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
