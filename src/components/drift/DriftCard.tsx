'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useDriftStore } from '@/stores/driftStore'
import { emotionalMotionProps } from '@/lib/emotionalStates'
import type { DriftEntry } from '@/types'

interface DriftCardProps {
  entry: DriftEntry
  onConvert: (text: string, driftId: string) => void
}

function formatTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DriftCard({ entry, onConvert }: DriftCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(entry.text)
  const [isPending, setIsPending] = useState(false)
  const updateEntry = useDriftStore((s) => s.updateEntry)
  const archiveEntry = useDriftStore((s) => s.archiveEntry)
  const deleteEntry = useDriftStore((s) => s.deleteEntry)

  async function handleSaveEdit() {
    const trimmed = editText.trim()
    if (!trimmed || isPending) return
    setIsPending(true)
    try {
      await updateEntry(entry.id, trimmed)
      setIsEditing(false)
    } finally {
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex gap-2 py-2">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit() }
            if (e.key === 'Escape') { setEditText(entry.text); setIsEditing(false) }
          }}
          onBlur={() => { setEditText(entry.text); setIsEditing(false) }}
          disabled={isPending}
          className="min-w-0 flex-1 rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none disabled:opacity-50"
        />
      </div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="group flex items-start gap-2 py-2"
    >
      <span className="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--text-ghost)" aria-hidden="true">
          <circle cx="4" cy="4" r="1.5" />
          <path d="M4 0v1.5M4 6.5V8M0 4h1.5M6.5 4H8" stroke="var(--text-ghost)" strokeWidth="0.5" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--text-primary)] break-words">{entry.text}</p>
        <span className="text-[10px] text-[var(--text-ghost)]">{formatTime(entry.createdAt)}</span>
      </div>

      <span className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <motion.button
          onClick={() => { setEditText(entry.text); setIsEditing(true) }}
          aria-label="Edit drift"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
            <path d="M8.5 1.5l2 2L4 10H2V8l6.5-6.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button
          onClick={() => onConvert(entry.text, entry.id)}
          aria-label="Convert to task"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" />
            <path d="M4 6l1.5 1.5L8 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button
          onClick={() => archiveEntry(entry.id)}
          aria-label="Archive drift"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
            <path d="M2 3h8M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M3 4v5a1 1 0 001 1h4a1 1 0 001-1V4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button
          onClick={() => deleteEntry(entry.id)}
          aria-label="Delete drift"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
          </svg>
        </motion.button>
      </span>
    </motion.div>
  )
}
