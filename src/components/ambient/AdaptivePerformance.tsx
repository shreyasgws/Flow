'use client'

import { useEffect } from 'react'
import { useEnvironmentStore, type PerformanceMode } from '@/stores/environmentStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { applyDeviceTier, TIERS } from '@/lib/deviceTier'
import { startPerformanceMonitor, stopPerformanceMonitor } from '@/lib/performanceMonitor'

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

function detectPerformance(): PerformanceMode {
  if (typeof navigator === 'undefined') return 'high'

  const nav = navigator as NavigatorWithMemory
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4

  if (cores <= 2 || mem <= 1) return 'low'
  if (cores <= 4 || mem <= 2) return 'medium'
  return 'high'
}

export function AdaptivePerformance() {
  const setPerformance = useEnvironmentStore((s) => s.setPerformance)
  const motionPreference = useSettingsStore((s) => s.settings.motionPreference)

  useEffect(() => {
    applyDeviceTier()
    const detected = detectPerformance()
    setPerformance(detected)
    startPerformanceMonitor()
    return () => stopPerformanceMonitor()
  }, [setPerformance])

  // When user sets motionPreference to 'reduced', force minimal tier
  useEffect(() => {
    if (motionPreference === 'reduced') {
      document.documentElement.dataset.tier = TIERS.MINIMAL
    } else {
      // Re-detect and apply the correct tier
      applyDeviceTier()
    }
  }, [motionPreference])

  return null
}
