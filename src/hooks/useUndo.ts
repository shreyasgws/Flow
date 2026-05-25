'use client'

import { useState, useCallback, useRef } from 'react'
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
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const currentUndo = stack.length > 0 ? stack[0] : null

  const push = useCallback((entry: UndoEntry) => {
    const existingTimer = timersRef.current.get(entry.id)
    if (existingTimer) clearTimeout(existingTimer)

    setStack((prev) => [entry, ...prev].slice(0, MAX_STACK))

    const timer = setTimeout(() => {
      setStack((prev) => prev.filter((e) => e.id !== entry.id))
      timersRef.current.delete(entry.id)
    }, AUTO_DISMISS_MS)
    timersRef.current.set(entry.id, timer)
  }, [])

  const undo = useCallback(async () => {
    const entry = stack[0]
    if (!entry) return
    try {
      await entry.undo()
    } finally {
      const timer = timersRef.current.get(entry.id)
      if (timer) clearTimeout(timer)
      timersRef.current.delete(entry.id)
      setStack((prev) => prev.filter((e) => e.id !== entry.id))
      await removeUndoFromDb(entry.id)
    }
  }, [stack])

  const dismiss = useCallback(() => {
    if (stack.length === 0) return
    const entry = stack[0]
    const timer = timersRef.current.get(entry.id)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(entry.id)
    setStack((prev) => prev.filter((e) => e.id !== entry.id))
  }, [stack])

  const undoFromStack = useCallback(async (id: string) => {
    const entry = stack.find((e) => e.id === id)
    if (!entry) return
    try {
      await entry.undo()
    } finally {
      const timer = timersRef.current.get(id)
      if (timer) clearTimeout(timer)
      timersRef.current.delete(id)
      setStack((prev) => prev.filter((e) => e.id !== id))
      await removeUndoFromDb(id)
    }
  }, [stack])

  return { push, undo, dismiss, currentUndo, stack, undoFromStack }
}
