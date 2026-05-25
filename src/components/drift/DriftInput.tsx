'use client'

import { useState, useRef } from 'react'
import { useDriftStore } from '@/stores/driftStore'

export function DriftInput() {
  const [text, setText] = useState('')
  const [isPending, setIsPending] = useState(false)
  const addEntry = useDriftStore((s) => s.addEntry)
  const ref = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (isPending) return
    const trimmed = text.trim()
    if (!trimmed) return
    setIsPending(true)
    try {
      const entry = await addEntry(trimmed)
      if (entry) {
        setText('')
        ref.current?.focus()
      }
    } finally {
      setIsPending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-[var(--bg-elevated)] pb-3">
      <input
        ref={ref}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What crossed your mind?"
        disabled={isPending}
        aria-label="Drift text"
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)] disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Save
      </button>
    </div>
  )
}
