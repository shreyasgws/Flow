'use client'

import { useEffect, useRef } from 'react'
import { useSyncStore } from '@/stores/syncStore'
import { flushQueue, flushFailed } from '@/lib/sync'

export function useSync() {
  const status = useSyncStore((s) => s.status)
  const lastSynced = useSyncStore((s) => s.lastSynced)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    flushQueue()

    const onOnline = () => {
      useSyncStore.getState().setStatus('syncing')
      flushFailed()
    }

    window.addEventListener('online', onOnline)

    intervalRef.current = setInterval(() => {
      flushQueue()
    }, 30000)

    return () => {
      window.removeEventListener('online', onOnline)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { status, lastSynced }
}
