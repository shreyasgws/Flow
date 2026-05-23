'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useErrorStore } from '@/stores/errorStore'

export function ErrorToast() {
  const errors = useErrorStore((s) => s.errors)
  const dismiss = useErrorStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence mode="popLayout">
        {errors.map((err) => (
          <motion.div
            key={err.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] px-4 py-3 shadow-lg ring-1 ring-[var(--bg-elevated)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--warn)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M7 4.5v3M7 10v.01" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--text-primary)]">{err.message}</p>
                <p className="text-xs text-[var(--text-secondary)]">{err.description}</p>
                {err.retry && (
                  <button
                    onClick={err.retry}
                    className="mt-1 text-xs text-[var(--accent)]"
                  >
                    Try again
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(err.id)}
                aria-label="Dismiss"
                className="shrink-0 text-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
