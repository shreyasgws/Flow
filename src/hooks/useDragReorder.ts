'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

interface DragReorderOptions {
  containerRef: React.RefObject<HTMLElement | null>
  scrollThreshold?: number
  maxScrollSpeed?: number
  cancelZoneSize?: number
}

interface DragReorderState {
  isAutoScrolling: boolean
  scrollDirection: 'up' | 'down' | null
  isNearEdge: boolean
  dropIndicatorIndex: number | null
}

const DEFAULT_SCROLL_THRESHOLD = 80
const DEFAULT_MAX_SPEED = 15
const DEFAULT_CANCEL_ZONE = 20

export function useDragReorder({
  containerRef,
  scrollThreshold = DEFAULT_SCROLL_THRESHOLD,
  maxScrollSpeed = DEFAULT_MAX_SPEED,
  cancelZoneSize = DEFAULT_CANCEL_ZONE,
}: DragReorderOptions): DragReorderState & { handleDragMove: (clientY: number) => void; reset: () => void } {
  const [state, setState] = useState<DragReorderState>({
    isAutoScrolling: false,
    scrollDirection: null,
    isNearEdge: false,
    dropIndicatorIndex: null,
  })
  const rafRef = useRef<number | null>(null)
  const scrollSpeedRef = useRef(0)
  const directionRef = useRef<'up' | 'down' | null>(null)

  const handleDragMove = useCallback((clientY: number) => {
    const viewportHeight = window.innerHeight
    const distFromTop = clientY
    const distFromBottom = viewportHeight - clientY

    const nearEdge = distFromTop < cancelZoneSize || distFromBottom < cancelZoneSize
    let dir: 'up' | 'down' | null = null
    let speed = 0

    if (distFromTop < scrollThreshold && !nearEdge) {
      dir = 'up'
      speed = maxScrollSpeed * (1 - distFromTop / scrollThreshold)
    } else if (distFromBottom < scrollThreshold && !nearEdge) {
      dir = 'down'
      speed = maxScrollSpeed * (1 - distFromBottom / scrollThreshold)
    }

    scrollSpeedRef.current = speed
    directionRef.current = dir

    setState((prev) => {
      if (
        prev.isAutoScrolling === (dir !== null) &&
        prev.scrollDirection === dir &&
        prev.isNearEdge === nearEdge
      ) {
        return prev
      }
      return {
        isAutoScrolling: dir !== null,
        scrollDirection: dir,
        isNearEdge: nearEdge,
        dropIndicatorIndex: prev.dropIndicatorIndex,
      }
    })
  }, [scrollThreshold, maxScrollSpeed, cancelZoneSize])

  const reset = useCallback(() => {
    scrollSpeedRef.current = 0
    directionRef.current = null
    setState({
      isAutoScrolling: false,
      scrollDirection: null,
      isNearEdge: false,
      dropIndicatorIndex: null,
    })
  }, [])

  useEffect(() => {
    function tick() {
      if (scrollSpeedRef.current > 0 && containerRef.current && directionRef.current) {
        const dir = directionRef.current
        if (dir === 'up') {
          containerRef.current.scrollTop = Math.max(0, containerRef.current.scrollTop - scrollSpeedRef.current)
        } else {
          containerRef.current.scrollTop += scrollSpeedRef.current
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [containerRef])

  return { ...state, handleDragMove, reset }
}
