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
    if (!containerRef.current) return
    const container = containerRef.current
    const scrollContainer = container.closest('[data-scroll-container]')
    const scrollEl = scrollContainer || document.documentElement
    const { scrollTop, clientHeight } = scrollEl

    const containerTop = container.getBoundingClientRect().top + window.scrollY

    const startIndex = Math.max(
      0,
      Math.floor((scrollTop - containerTop) / TASK_HEIGHT_ESTIMATE) - OVERSCAN,
    )
    const endIndex = Math.min(
      count,
      Math.ceil((scrollTop - containerTop + clientHeight) / TASK_HEIGHT_ESTIMATE) + OVERSCAN,
    )

    setVisibleRange({ start: startIndex, end: endIndex })
  }, [count])

  useEffect(() => {
    updateVisibleRange()
    window.addEventListener('scroll', updateVisibleRange, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibleRange)
  }, [updateVisibleRange])

  const totalHeight = count * TASK_HEIGHT_ESTIMATE

  return (
    <div ref={containerRef} className="relative" style={{ height: totalHeight }}>
      <div style={{ transform: `translateY(${visibleRange.start * TASK_HEIGHT_ESTIMATE}px)` }}>
        {children(visibleRange)}
      </div>
    </div>
  )
}
