'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useDriftStore } from '@/stores/driftStore'
import { DriftPanel } from '@/components/drift/DriftPanel'

export function DriftButton() {
  const [open, setOpen] = useState(false)
  const entries = useDriftStore((s) => s.entries)
  const now = Date.now()
  const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000
  const activeCount = entries.filter((e) => now - e.createdAt < SEVENTY_TWO_HOURS).length

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-overlay)] shadow-lg backdrop-blur-md"
        style={{ border: '1px solid rgba(91,140,255,0.35)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--accent)]"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </motion.button>
      <DriftPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
