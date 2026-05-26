'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReflectionStore } from '@/stores/reflectionStore'
import { useTaskStore } from '@/stores/taskStore'
import { useDriftStore } from '@/stores/driftStore'

interface WeekReflectionProps {
  weekStart: string
}

function getWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function WeekReflection({ weekStart }: WeekReflectionProps) {
  const existing = useReflectionStore((s) => s.getReflectionForWeek(weekStart))
  const saveReflection = useReflectionStore((s) => s.saveReflection)
  const tasks = useTaskStore((s) => s.tasks)
  const driftEntries = useDriftStore((s) => s.entries)
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState(existing?.content ?? '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(existing?.categories ?? [])
  const [isSaving, setIsSaving] = useState(false)

  const CATEGORY_OPTIONS = [
    { id: 'productivity', label: 'Productivity' },
    { id: 'rest', label: 'Rest & Recovery' },
    { id: 'creative', label: 'Creative' },
    { id: 'social', label: 'Social' },
    { id: 'health', label: 'Health' },
  ]

  const handleSave = useCallback(async () => {
    if (!content.trim()) return
    setIsSaving(true)
    try {
      await saveReflection(weekStart, content.trim(), selectedCategories)
    } finally {
      setIsSaving(false)
    }
  }, [content, selectedCategories, weekStart, saveReflection])

  const weekActiveTasks = tasks.filter((t) => {
    const taskDate = new Date(t.date + 'T00:00:00')
    const start = new Date(weekStart + 'T00:00:00')
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return taskDate >= start && taskDate < end
  })

  const weekCompleted = weekActiveTasks.filter((t) => t.status === 'completed').length
  const weekTotal = weekActiveTasks.length

  const weekDriftEntries = driftEntries.filter((e) => {
    const entryDate = new Date(e.createdAt)
    const start = new Date(weekStart + 'T00:00:00')
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return entryDate >= start && entryDate < end
  })

  const recentDrift = weekDriftEntries
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 2)

  return (
    <div className="mt-8 border-t border-[var(--bg-elevated)] pt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <div>
          <p className="font-serif text-base text-[var(--text-primary)]">
            How was your week?
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {getWeekRange(weekStart)}
          </p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--text-muted)]"
          aria-hidden="true"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {!existing && (
                <p className="text-xs text-[var(--text-secondary)]">
                  How did this week feel? No pressure — just a thought if you want to leave one.
                </p>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reflection..."
                rows={4}
                className="w-full resize-none rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent)] focus:outline-none"
              />

              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          isSelected
                            ? prev.filter((c) => c !== cat.id)
                            : [...prev, cat.id],
                        )
                      }
                      className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
                        isSelected
                          ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {content.trim() && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary px-4 py-1.5"
                >
                  {isSaving ? 'Saving...' : existing ? 'Update reflection' : 'Save reflection'}
                </button>
              )}

              {weekDriftEntries.length > 0 && (
                <div className="border-t border-[var(--bg-elevated)] pt-4">
                  <p className="mb-2 text-xs text-[var(--text-muted)]">
                    This week in drift — {weekDriftEntries.length} thought{weekDriftEntries.length > 1 ? 's' : ''}
                  </p>
                  {recentDrift.map((entry) => (
                    <p key={entry.id} className="text-sm text-[var(--text-secondary)] italic">
                      &ldquo;{entry.text.length > 100 ? entry.text.slice(0, 100) + '...' : entry.text}&rdquo;
                    </p>
                  ))}
                </div>
              )}

              {weekTotal > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  {weekCompleted}/{weekTotal} tasks completed this week.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
