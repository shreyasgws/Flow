'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useEnvironmentStore } from '@/stores/environmentStore'

const GRADIENT_VARS: Record<string, string> = {
  morning: 'var(--gradient-morning)',
  afternoon: 'var(--gradient-afternoon)',
  evening: 'var(--gradient-evening)',
  night: 'var(--gradient-night)',
}

function getTimePeriod(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function AmbientBackground() {
  const mode = useEnvironmentStore((s) => s.state.mode)
  const hour = new Date().getHours()
  const period = useMemo(() => getTimePeriod(hour), [hour])

  return (
    <div className="fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: GRADIENT_VARS[period] }}
        animate={mode === 'ambient' ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--vignette)' }} />
    </div>
  )
}
