'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useFocusStore } from '@/stores/focusStore'

export function FocusBreakPrompt() {
  const secondsRemaining = useFocusStore((s) => s.secondsRemaining)
  const isBreak = useFocusStore((s) => s.isBreak)
  const cancelTimer = useFocusStore((s) => s.cancelTimer)
  const [dismissed, setDismissed] = useState(false)

  const timerJustEnded = secondsRemaining !== null && secondsRemaining <= 0 && isBreak === false

  useEffect(() => {
    if (timerJustEnded) {
      if (navigator.vibrate) navigator.vibrate(100)
      setDismissed(false)
    }
  }, [timerJustEnded])

  const showPrompt = timerJustEnded && !dismissed

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-4 text-center"
        >
          <p className="mb-3 text-sm text-[var(--text-primary)]">
            Nice work. Take a break?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                const config = useFocusStore.getState().timerConfig
                const breakMin = config?.breakMinutes ?? 5
                useFocusStore.setState({
                  phase: 'break',
                  isBreak: true,
                  secondsRemaining: breakMin * 60,
                  isPaused: false,
                })
                setDismissed(true)
              }}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
            >
              Take a break
            </button>
            <button
              onClick={() => {
                cancelTimer()
                setDismissed(true)
              }}
              className="rounded-full bg-[var(--bg-elevated)] px-5 py-2 text-sm text-[var(--text-secondary)] transition-opacity hover:opacity-80"
            >
              Keep going
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
