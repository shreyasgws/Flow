'use client'

import { motion } from 'motion/react'

interface CompletionRingProps {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
  dayWeight?: 'light' | 'medium' | 'heavy'
}

const WEIGHT_RING: Record<string, { opacity: number; strokeWidth: number }> = {
  light: { opacity: 0.15, strokeWidth: 6 },
  medium: { opacity: 0.3, strokeWidth: 8 },
  heavy: { opacity: 0.5, strokeWidth: 10 },
}

export function CompletionRing({ completed, total, size = 60, strokeWidth = 4, dayWeight }: CompletionRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? completed / total : 0
  const dashOffset = circumference * (1 - ratio)

  const weightStyle = dayWeight ? WEIGHT_RING[dayWeight] : null

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemax={total}
      aria-label={`${completed} of ${total} tasks completed`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {weightStyle && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 2}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={weightStyle.strokeWidth}
            opacity={weightStyle.opacity}
          />
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <span className="absolute text-xs text-[var(--text-secondary)]">
        {total > 0 ? `${completed}/${total}` : '—'}
      </span>
    </div>
  )
}
