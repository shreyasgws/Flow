'use client'

import { useState, useCallback, useRef, useId } from 'react'
import { db } from '@/lib/db'
import { removeUndoFromDb } from '@/lib/undo'

interface UndoEntry {
  id: string
  label: string
  undo: () => void | Promise<void>
}

const MAX_STACK = 50
const AUTO_DISMISS_MS = 6000

export function useUndo() {
  const [stack, setStack] = useState<UndoEntry[]>([])
  const [currentUndo, setCurrentUndo] = useState<UndoEntry | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback((entry: UndoEntry) => {
    setStack((prev) => {
      const next = [entry, ...prev].slice(0, MAX_STACK)
      return next
    })
    setCurrentUndo(entry)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrentUndo(null)
    }, AUTO_DISMISS_MS)
  }, [])

  const undo = useCallback(async () => {
    const entry = currentUndo
    if (!entry) return
    try {
      await entry.undo()
    } finally {
      setStack((prev) => prev.filter((e) => e.id !== entry.id))
      setCurrentUndo(null)
      if (timerRef.current) clearTimeout(timerRef.current)
      await removeUndoFromDb(entry.id)
    }
  }, [currentUndo])

  const dismiss = useCallback(() => {
    setCurrentUndo(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const undoFromStack = useCallback(async (id: string) => {
    const entry = stack.find((e) => e.id === id)
    if (!entry) return
    try {
      await entry.undo()
    } finally {
      setStack((prev) => prev.filter((e) => e.id !== id))
      setCurrentUndo((cur) => (cur?.id === id ? null : cur))
      await removeUndoFromDb(id)
    }
  }, [stack])

  return { push, undo, dismiss, currentUndo, stack, undoFromStack }
}
