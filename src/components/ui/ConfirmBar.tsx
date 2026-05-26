'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useConfirmStore } from '@/stores/confirmStore'

export function ConfirmBar() {
  const options = useConfirmStore((s) => s.options)
  const hide = useConfirmStore((s) => s.hide)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (options) {
      const timeout = options.timeout ?? 8000
      timerRef.current = setTimeout(hide, timeout)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [options, hide])

  async function handleConfirm() {
    await options?.onConfirm?.()
    hide()
  }

  function handleCancel() {
    hide()
  }

  return (
    <AnimatePresence>
      {options && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }}
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--bg-overlay)] px-4 py-2 shadow-lg backdrop-blur-md"
        >
          <span className="max-w-48 truncate text-sm text-[var(--text-primary)]">
            {options.message}
          </span>
          <button
            onClick={handleConfirm}
            className="btn-ghost shrink-0 text-sm font-bold text-[var(--accent)]"
          >
            {options.confirmLabel ?? 'Delete'}
          </button>
          <button
            onClick={handleCancel}
            className="btn-ghost shrink-0 text-xs"
          >
            {options.cancelLabel ?? 'Cancel'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
