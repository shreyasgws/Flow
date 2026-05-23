'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { slideUp } from '@/motions/variants'

interface AddTaskFormProps {
  sectionId: string | null
  date: string
  sortOrder: number
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

export function AddTaskForm({
  sectionId,
  date,
  sortOrder,
  isActive,
  onActivate,
  onDeactivate,
}: AddTaskFormProps) {
  const [text, setText] = useState('')
  const [isPending, setIsPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTaskStore((s) => s.addTask)

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  async function handleSubmit() {
    if (isPending) return
    const trimmed = text.trim()
    if (!trimmed) return
    setIsPending(true)
    try {
      const task = await addTask({
        title: trimmed,
        flowSectionId: sectionId,
        date,
        sortOrder,
        estimatedMinutes: null,
        isRecurring: false,
        sourceDriftId: null,
        frictionLevel: null,
        focusWindowStart: null,
        focusWindowEnd: null,
        completedAt: null,
      })
      if (task) {
        setText('')
        inputRef.current?.focus()
      }
    } finally {
      setIsPending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setText('')
      onDeactivate()
    }
  }

  if (!isActive) {
    return (
      <button
        onClick={onActivate}
        className="flex w-full items-center gap-3 py-2 text-xs text-[var(--text-ghost)] transition-colors hover:text-[var(--text-muted)]"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-[var(--text-ghost)]">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </span>
        Add task
      </button>
    )
  }

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-3 py-2"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M4 1v6M1 4h6" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!text.trim() && !isPending) onDeactivate()
        }}
        placeholder="What is one thing?"
        disabled={isPending}
        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)] disabled:opacity-50"
      />
      <button
        onClick={() => { setText(''); onDeactivate() }}
        disabled={isPending}
        aria-label="Cancel"
        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-50"
      >
        Esc
      </button>
    </motion.div>
  )
}
