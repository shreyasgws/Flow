'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { slideUp } from '@/motions/variants'
import { RecurrencePicker } from './RecurrencePicker'

interface AddTaskFormProps {
  sectionId: string | null
  date: string
  sortOrder: number
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly'

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
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
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
      const isRecurring = recurrence !== 'none'
      const task = await addTask({
        title: trimmed,
        flowSectionId: sectionId,
        date,
        sortOrder,
        estimatedMinutes: null,
        isRecurring,
        recurrenceType: recurrence,
        recurrenceBaseId: null,
        sourceDriftId: null,
        frictionLevel: null,
        focusWindowStart: null,
        focusWindowEnd: null,
        completedAt: null,
      })
      if (task) {
        setText('')
        setRecurrence('none')
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
      setRecurrence('none')
      onDeactivate()
    }
  }

  function handleCancel() {
    setText('')
    setRecurrence('none')
    onDeactivate()
  }

  if (!isActive) {
    return (
      <button
        onClick={onActivate}
        aria-label="Add task"
        className="flex w-full items-center gap-3 py-2 text-xs text-[var(--text-ghost)] transition-colors hover:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
      className="py-2"
    >
      <div className="flex items-center gap-3">
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
            if (!text.trim() && !isPending) handleCancel()
          }}
          placeholder="What is one thing?"
          disabled={isPending}
          aria-label="Task title"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)] disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !text.trim()}
          aria-label="Add task"
          className="btn-primary px-3 py-1 text-[11px] font-medium"
        >
          Done
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          aria-label="Cancel"
          className="btn-ghost text-[10px]"
        >
          Esc
        </button>
      </div>
      <div className="ml-7 mt-1.5">
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />
      </div>
    </motion.div>
  )
}
