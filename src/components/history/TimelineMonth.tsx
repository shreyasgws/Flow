'use client'

import { motion } from 'motion/react'

interface TimelineMonthProps {
  label: string
  children: React.ReactNode
}

export function TimelineMonth({ label, children }: TimelineMonthProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      <h2 className="mb-3 font-serif text-lg tracking-tight text-[var(--text-primary)]">
        {label}
      </h2>
      {children}
    </motion.div>
  )
}
