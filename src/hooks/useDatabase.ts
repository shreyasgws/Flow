'use client'

import { useEffect, useState } from 'react'
import { getDb, seedDefaultSections } from '@/lib/db'

export function useDatabase() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const db = getDb()
        await db.open()
        if (cancelled) return
        await seedDefaultSections()
        if (!cancelled) setIsReady(true)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('DB init failed'))
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  return { isReady, error }
}
