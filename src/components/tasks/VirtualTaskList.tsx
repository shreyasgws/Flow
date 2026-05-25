'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'

const TASK_HEIGHT_ESTIMATE = 56
const OVERSCAN = 3

interface VirtualTaskListProps {
  count: number
  children: (visibleRange: { start: number; end: number }) => ReactNode
}

export function VirtualTaskList({ count, children }: VirtualTaskListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: count })

  const updateVisibleRange = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const viewStart = -rect.top
    const viewEnd = viewStart + window.innerHeight

    const startIndex = Math.max(0, Math.floor(viewStart / TASK_HEIGHT_ESTIMATE) - OVERSCAN)
    const endIndex = Math.min(count, Math.ceil(viewEnd / TASK_HEIGHT_ESTIMATE) + OVERSCAN)

    setVisibleRange({ start: startIndex, end: endIndex })
  }, [count])

  useEffect(() => {
    updateVisibleRange()
    window.addEventListener('scroll', updateVisibleRange, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibleRange)
  }, [updateVisibleRange])

  const totalHeight = count * TASK_HEIGHT_ESTIMATE
  const offset = visibleRange.start * TASK_HEIGHT_ESTIMATE

  return (
    <div ref={containerRef} className="relative" style={{ height: totalHeight }}>
      <div style={{ transform: `translateY(${offset}px)` }}>
        {children(visibleRange)}
      </div>
    </div>
  )
}