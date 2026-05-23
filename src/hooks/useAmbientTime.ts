'use client'

import { useEffect } from 'react'
import { useEnvironmentStore } from '@/stores/environmentStore'

export function useAmbientTime() {
  const updateTime = useEnvironmentStore((s) => s.updateTime)

  useEffect(() => {
    updateTime()
    const interval = setInterval(updateTime, 60_000)
    return () => clearInterval(interval)
  }, [updateTime])
}
