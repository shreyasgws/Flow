'use client'

import { motion } from 'motion/react'

export type EmptyDayVariant = 'first-launch' | 'zero-task' | 'completed'

interface EmptyDayProps {
  variant: EmptyDayVariant
  completedCount?: number
  sectionCount?: number
  onCreateSection?: () => void
}

export function EmptyDay({ variant, completedCount = 0, sectionCount = 0, onCreateSection }: EmptyDayProps) {
  if (variant === 'first-launch') {
    return (
      <div className="mt-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-sm text-[var(--text-secondary)]"
        >
          Welcome. Tap below to plan your first day.
        </motion.p>
        {onCreateSection && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            onClick={onCreateSection}
            className="mt-4 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
          >
            Create your first section
          </motion.button>
        )}
      </div>
    )
  }

  if (variant === 'completed') {
    return (
      <div className="mt-8 text-center">
        <p className="font-serif text-base text-[var(--text-primary)]">
          All done for today.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {completedCount} task{completedCount > 1 ? 's' : ''} completed across {sectionCount} section{sectionCount > 1 ? 's' : ''}.
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-ghost)]">
          The day feels quieter now.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-[var(--text-muted)]">
        Nothing planned yet — and that is fine. Start whenever.
      </p>
    </div>
  )
}
