'use client'

import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { taskComplete } from '@/motions/variants'
import { emotionalMotionProps, emotionalRingStyles } from '@/lib/emotionalStates'

interface TaskCardProps {
  id: string
  title: string
  status: 'active' | 'completed' | 'archived'
  estimatedMinutes?: number | null
  sortOrder: number
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragTarget?: boolean
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  isFirst?: boolean
  isLast?: boolean
}

export function TaskCard({
  id,
  title,
  status,
  estimatedMinutes,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: TaskCardProps) {
  const completeTask = useTaskStore((s) => s.completeTask)
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const [isPending, setIsPending] = useState(false)
  const [emotionalState, setEmotionalState] = useState<'idle' | 'completing' | 'error'>('idle')
  const isDone = status === 'completed'
  const dragRef = useRef<HTMLDivElement>(null)

  async function handleToggle() {
    if (isPending) return
    setEmotionalState('completing')
    setIsPending(true)
    try {
      if (isDone) {
        await uncompleteTask(id)
      } else {
        await completeTask(id)
      }
      setEmotionalState('idle')
    } catch {
      setEmotionalState('error')
      setTimeout(() => setEmotionalState('idle'), 600)
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (isPending) return
    setIsPending(true)
    try {
      await deleteTask(id)
    } finally {
      setIsPending(false)
    }
  }

  function handleDragStart(e: React.DragEvent) {
    onDragStart?.(e, id)
  }

  function handleDragOver(e: React.DragEvent) {
    onDragOver?.(e, id)
  }

  function handleDrop(e: React.DragEvent) {
    onDrop?.(e, id)
  }

  return (
    <motion.div
      layout
      variants={taskComplete}
      initial="initial"
      animate={isDone ? 'done' : 'initial'}
      className={`${isDragTarget ? 'rounded-md bg-[var(--ambient-glow)]' : ''}`}
    >
      <div
        ref={dragRef}
        draggable={!isDone && !isPending}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        className={`group flex items-center gap-2 py-2 ${
          !isDone ? 'cursor-grab active:cursor-grabbing' : ''
        } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {!isDone && (
          <span
            className="shrink-0 text-[var(--text-ghost)] opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Drag to reorder"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="2" r="1.2" />
              <circle cx="7" cy="2" r="1.2" />
              <circle cx="3" cy="7" r="1.2" />
              <circle cx="7" cy="7" r="1.2" />
              <circle cx="3" cy="12" r="1.2" />
              <circle cx="7" cy="12" r="1.2" />
            </svg>
          </span>
        )}

        <motion.button
          onClick={handleToggle}
          disabled={isPending}
          aria-label={isDone ? `Uncomplete "${title}"` : `Complete "${title}"`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          animate={emotionalMotionProps(emotionalState)}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
            isDone
              ? 'border-[var(--accent)] bg-[var(--accent)]'
              : 'border-[var(--text-muted)] hover:border-[var(--accent)]'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          {isDone && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path
                d="M1.5 4L3.5 6L6.5 2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.button>

        <span
          className={`flex-1 text-sm transition-all ${
            isDone
              ? 'text-[var(--text-muted)] line-through'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {title}
        </span>

        {!isDone && estimatedMinutes && (
          <span className="text-[10px] text-[var(--text-ghost)]">
            {estimatedMinutes}m
          </span>
        )}

        {!isDone && (
          <span className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
            {!isFirst && (
              <button
                onClick={() => onMoveUp?.(id)}
                aria-label="Move task up"
                className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M6 9V3M3 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {!isLast && (
              <button
                onClick={() => onMoveDown?.(id)}
                aria-label="Move task down"
                className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M6 3v6M3 6l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </span>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete "${title}"`}
          className="opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            aria-hidden="true"
          >
            <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
