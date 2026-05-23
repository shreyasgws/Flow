'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { slideUp } from '@/motions/variants'

interface UndoSnackbarProps {
  currentUndo: { id: string; label: string } | null
  onUndo: () => void
  onDismiss: () => void
}

export function UndoSnackbar({ currentUndo, onUndo, onDismiss }: UndoSnackbarProps) {
  return (
    <AnimatePresence>
      {currentUndo && (
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
          <button onClick={onUndo} className="shrink-0 text-sm font-bold text-[var(--accent)]">
            Undo
          </button>
          <button onClick={onDismiss} className="shrink-0 text-xs text-[var(--text-muted)]">
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
