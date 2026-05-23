'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'

const TIME_GRADIENTS: Record<string, string> = {
  morning: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 30%, #3d2b1a 60%, #2a1f1f 100%)',
  afternoon: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1a1a2e 60%, #16213e 100%)',
  evening: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 30%, #1a1a2e 60%, #0f0f1a 100%)',
  night: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 30%, #0f0f1a 60%, #050510 100%)',
}

function getTimePeriod(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function AmbientBackground() {
  const hour = new Date().getHours()
  const period = useMemo(() => getTimePeriod(hour), [hour])
  const gradient = TIME_GRADIENTS[period]

  return (
    <div className="fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: gradient }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(14,14,16,0.6) 100%)',
        }}
      />
    </div>
  )
}
