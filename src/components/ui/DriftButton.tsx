'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { useDriftStore } from '@/stores/driftStore'
import { DriftPanel } from '@/components/drift/DriftPanel'
import { DandelionIcon } from '@/components/drift/DandelionIcon'

export function DriftButton() {
  const [open, setOpen] = useState(false)
  const [burst, setBurst] = useState(false)
  const entries = useDriftStore((s) => s.entries)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })
  const hasMoved = useRef(false)

  const now = Date.now()
  const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000
  const activeCount = entries.filter((e) => now - e.createdAt < SEVENTY_TWO_HOURS).length

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    hasMoved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y }
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true
      setIsDragging(true)
    }
    if (hasMoved.current) {
      setPos({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      })
    }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false)
    if (!hasMoved.current) {
      setOpen(true)
    }
    const el = e.currentTarget as HTMLElement
    el.releasePointerCapture(e.pointerId)
  }, [])

  function handleOpen() {
    if (!hasMoved.current) {
      setOpen(true)
      setBurst(true)
      setTimeout(() => setBurst(false), 600)
    }
  }

  return (
    <>
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleOpen}
        aria-label={open ? 'Close drift' : 'Open drift'}
        aria-expanded={open}
        className="fixed bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/35 bg-[var(--bg-overlay)] shadow-lg backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{
          right: 16,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        whileHover={isDragging ? {} : { scale: 1.05 }}
        whileTap={isDragging ? {} : { scale: 0.95 }}
      >
        <DandelionIcon triggerBurst={burst} />
        {activeCount > 0 && (
          <span
            aria-label={`${activeCount} active drift entr${activeCount === 1 ? 'y' : 'ies'}`}
            className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white"
          >
            {activeCount}
          </span>
        )}
      </motion.button>
      <DriftPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
