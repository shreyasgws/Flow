'use client'

import { useRef, useCallback } from 'react'
import { hapticDragPickup, hapticDropCommit } from '@/lib/haptics'

const SWIPE_THRESHOLD = 40
const VERTICAL_CANCEL_THRESHOLD = 15
const LONG_PRESS_DURATION = 300
const LONG_PRESS_MOVE_THRESHOLD = 10
const LONG_PRESS_MOVE_WINDOW = 500
const GESTURE_PRIORITY_WINDOW = 100
const MIN_DRAG_DISTANCE = 5
const JITTER_WINDOW_MS = 80
const JITTER_MAX_DELTA = 3
const TAP_MAX_DURATION = 300
const TAP_MAX_MOVE = 8

export type GestureType = 'tap' | 'longpress' | 'swipe' | 'scroll'
export type SwipeDirection = 'left' | 'right'

interface GestureStartEvent {
  clientX: number
  clientY: number
}

interface GestureMoveEvent {
  clientX: number
  clientY: number
}

interface GestureEndEvent {
  clientX: number
  clientY: number
}

export interface GestureHandlers {
  onTap?: () => void
  onLongPress?: () => void
  onSwipe?: (direction: SwipeDirection) => void
  onDragStart?: () => void
  onDragMove?: (deltaX: number, deltaY: number) => void
  onDragEnd?: (deltaX: number, deltaY: number) => void
  onDragCancel?: () => void
}

export function useGestures(handlers: GestureHandlers) {
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastMoveRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDraggingRef = useRef(false)
  const isLongPressRef = useRef(false)
  const gestureTypeRef = useRef<GestureType | null>(null)

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  function reset() {
    startRef.current = null
    lastMoveRef.current = null
    isDraggingRef.current = false
    isLongPressRef.current = false
    gestureTypeRef.current = null
  }

  const moveHistoryRef = useRef<{ x: number; y: number; t: number }[]>([])

  const isJitter = useCallback((x: number, y: number, t: number) => {
    const history = moveHistoryRef.current
    history.push({ x, y, t })
    while (history.length > 0 && t - history[0].t > JITTER_WINDOW_MS) {
      history.shift()
    }
    if (history.length < 4) return false
    let dirChanges = 0
    for (let i = 2; i < history.length; i++) {
      const dx1 = history[i - 1].x - history[i - 2].x
      const dx2 = history[i].x - history[i - 1].x
      if (dx1 * dx2 < 0 && Math.abs(dx1) > JITTER_MAX_DELTA) dirChanges++
    }
    return dirChanges >= 3
  }, [])

  const handlePointerDown = useCallback((e: GestureStartEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    isDraggingRef.current = false
    isLongPressRef.current = false
    gestureTypeRef.current = null
    moveHistoryRef.current = [{ x: e.clientX, y: e.clientY, t: Date.now() }]

    longPressTimerRef.current = setTimeout(() => {
      if (gestureTypeRef.current !== 'scroll') {
        isLongPressRef.current = true
        gestureTypeRef.current = 'longpress'
        handlers.onLongPress?.()
      }
    }, LONG_PRESS_DURATION)
  }, [handlers])

  const handlePointerMove = useCallback((e: GestureMoveEvent) => {
    if (!startRef.current || !lastMoveRef.current) return

    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    const dt = Date.now() - startRef.current.time

    if (Math.abs(dx) < MIN_DRAG_DISTANCE && Math.abs(dy) < MIN_DRAG_DISTANCE) {
      return
    }

    if (isJitter(e.clientX, e.clientY, Date.now())) {
      return
    }

    if (gestureTypeRef.current === 'scroll') {
      if (isDraggingRef.current) {
        handlers.onDragMove?.(
          e.clientX - lastMoveRef.current.x,
          e.clientY - lastMoveRef.current.y,
        )
      }
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
      return
    }

    if (dt < GESTURE_PRIORITY_WINDOW && Math.abs(dy) > VERTICAL_CANCEL_THRESHOLD) {
      clearLongPress()
      gestureTypeRef.current = 'scroll'
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
      return
    }

    if (Math.abs(dy) > VERTICAL_CANCEL_THRESHOLD && gestureTypeRef.current !== 'swipe') {
      clearLongPress()
      gestureTypeRef.current = 'scroll'
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
      return
    }

    if (isLongPressRef.current) {
      const moveDx = e.clientX - (lastMoveRef.current?.x ?? startRef.current.x)
      const moveDy = e.clientY - (lastMoveRef.current?.y ?? startRef.current.y)
      const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy)
      if (moveDist > LONG_PRESS_MOVE_THRESHOLD) {
        const elapsed = Date.now() - startRef.current.time
        if (elapsed > LONG_PRESS_MOVE_WINDOW) {
          clearLongPress()
          isLongPressRef.current = false
          gestureTypeRef.current = 'scroll'
          lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
          return
        }
      }
    }

    if (Math.abs(dx) > SWIPE_THRESHOLD && gestureTypeRef.current === null) {
      clearLongPress()
      gestureTypeRef.current = 'swipe'
      return
    }

    if (isDraggingRef.current) {
      handlers.onDragMove?.(
        e.clientX - lastMoveRef.current.x,
        e.clientY - lastMoveRef.current.y,
      )
    }

    lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
  }, [handlers, clearLongPress, isJitter])

  const handlePointerUp = useCallback((e: GestureEndEvent) => {
    clearLongPress()

    if (gestureTypeRef.current === 'swipe') {
      const dx = e.clientX - (startRef.current?.x ?? 0)
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        handlers.onSwipe?.(dx > 0 ? 'right' : 'left')
      }
      reset()
      return
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - (startRef.current?.x ?? 0)
      const dy = e.clientY - (startRef.current?.y ?? 0)
      handlers.onDragEnd?.(dx, dy)
      reset()
      return
    }

    if (isLongPressRef.current) {
      reset()
      return
    }

    if (gestureTypeRef.current === null) {
      const totalDt = Date.now() - (startRef.current?.time ?? 0)
      const totalDx = Math.abs((e.clientX ?? 0) - (startRef.current?.x ?? 0))
      const totalDy = Math.abs((e.clientY ?? 0) - (startRef.current?.y ?? 0))
      if (totalDt <= TAP_MAX_DURATION && totalDx <= TAP_MAX_MOVE && totalDy <= TAP_MAX_MOVE) {
        handlers.onTap?.()
      }
    }

    reset()
  }, [handlers, clearLongPress])

  const handlePointerCancel = useCallback(() => {
    clearLongPress()
    if (isDraggingRef.current) {
      handlers.onDragCancel?.()
    }
    reset()
  }, [handlers, clearLongPress])

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    get isDragging() { return isDraggingRef.current },
    get gestureType() { return gestureTypeRef.current },
    setDragging: (v: boolean) => { isDraggingRef.current = v },
  }
}
