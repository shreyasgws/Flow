'use client'

import { useEffect } from 'react'
import { useEnvironmentStore, type PerformanceMode } from '@/stores/environmentStore'

declare global {
  interface Navigator {
    deviceMemory?: number
  }
}

function detectPerformance(): PerformanceMode {
  if (typeof navigator === 'undefined') return 'high'

  const cores = navigator.hardwareConcurrency ?? 4
  const mem = navigator.deviceMemory ?? 4

  if (cores <= 2 || mem <= 1) return 'low'
  if (cores <= 4 || mem <= 2) return 'medium'
  return 'high'
}

export function AdaptivePerformance() {
  const setPerformance = useEnvironmentStore((s) => s.setPerformance)

  useEffect(() => {
    const detected = detectPerformance()
    setPerformance(detected)
  }, [setPerformance])

  return null
}
