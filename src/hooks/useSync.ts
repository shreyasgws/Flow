'use client'

import { useEffect, useRef } from 'react'
import { useSyncStore } from '@/stores/syncStore'
import { flushQueue, flushFailed } from '@/lib/sync'

const STALE_THRESHOLD_MS = 120000

export function useSync() {
  const status = useSyncStore((s) => s.status)
  const lastSynced = useSyncStore((s) => s.lastSynced)
  const sessionId = useSyncStore((s) => s.sessionId)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    flushQueue()

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('flow-sync')
      channelRef.current = channel

      channel.postMessage({ type: 'hello', sessionId })

      channel.onmessage = (e) => {
        const msg = e.data
        if (!msg || msg.sessionId === sessionId) return

        if (msg.type === 'hello') {
          channel.postMessage({ type: 'ack', sessionId })
        }

        if (msg.type === 'ack') {
          const now = Date.now()
          useSyncStore.getState().setLastRemoteChange(now)
        }

        if (msg.type === 'data-changed') {
          const now = Date.now()
          useSyncStore.getState().setLastRemoteChange(now)
          const lastSync = useSyncStore.getState().lastSynced
          if (lastSync && now - lastSync > STALE_THRESHOLD_MS) {
            useSyncStore.getState().setStatus('reconnecting')
            flushQueue().then(() => {
              useSyncStore.getState().setStatus('saved')
              useSyncStore.getState().setLastSynced(Date.now())
            })
          }
        }
      }
    }

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
      channelRef.current?.close()
    }
  }, [sessionId])

  return { status, lastSynced }
}
