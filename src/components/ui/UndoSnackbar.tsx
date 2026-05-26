'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { slideUp } from '@/motions/variants'
import { hapticGentleReturn } from '@/lib/haptics'

interface UndoSnackbarProps {
  currentUndo: { id: string; label: string } | null
  stack: { id: string; label: string }[]
  onUndo: () => void
  onUndoFromStack: (id: string) => void
  onDismiss: () => void
}

export function UndoSnackbar({ currentUndo, stack, onUndo, onUndoFromStack, onDismiss }: UndoSnackbarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <AnimatePresence>
        {currentUndo && !expanded && (
          <motion.div
            key={currentUndo.id}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
            className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--bg-overlay)] px-4 py-2 shadow-lg backdrop-blur-md"
          >
            <span className="max-w-48 truncate text-sm text-[var(--text-primary)]">
              {currentUndo.label}
            </span>
            <button onClick={() => { hapticGentleReturn(); onUndo() }} aria-label="Undo action" className="btn-ghost shrink-0 text-sm font-bold text-[var(--accent)]">
              Undo
            </button>
            {stack.length > 1 && (
              <button onClick={() => setExpanded(true)} aria-label={`${stack.length - 1} more actions`} className="btn-ghost shrink-0 text-xs text-[var(--text-muted)]">
                +{stack.length - 1}
              </button>
            )}
            <button onClick={onDismiss} aria-label="Dismiss" className="btn-ghost shrink-0 text-xs text-[var(--text-muted)]">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }}
            className="fixed bottom-24 left-1/2 z-50 w-72 -translate-x-1/2 rounded-2xl bg-[var(--bg-surface)] p-3 shadow-xl ring-1 ring-[var(--bg-elevated)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Recent actions</span>
              <button onClick={() => setExpanded(false)} className="btn-ghost text-xs">
                Close
              </button>
            </div>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {stack.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[var(--bg-elevated)]">
                  <span className="truncate text-sm text-[var(--text-primary)]">{entry.label}</span>
                  <button
                    onClick={() => { hapticGentleReturn(); onUndoFromStack(entry.id); setExpanded(false) }}
                    className="btn-ghost shrink-0 text-sm font-bold text-[var(--accent)]"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
