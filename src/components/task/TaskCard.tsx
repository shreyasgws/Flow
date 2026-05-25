'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { useConfirmStore } from '@/stores/confirmStore'
import { taskComplete } from '@/motions/variants'
import { emotionalMotionProps } from '@/lib/emotionalStates'
import { useCategoryStore } from '@/stores/categoryStore'
import { useGestures } from '@/hooks/useGestures'
import { hapticSoftTap, hapticDragPickup, hapticDropCommit } from '@/lib/haptics'

interface TaskCardProps {
  id: string
  title: string
  status: 'active' | 'completed' | 'archived'
  estimatedMinutes?: number | null
  categoryId?: string | null
  frictionLevel?: string | null
  sortOrder: number
  isRecurring?: boolean
  recurrenceType?: 'none' | 'daily' | 'weekdays' | 'weekly'
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragTarget?: boolean
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  isFirst?: boolean
  isLast?: boolean
  onComplete?: (id: string) => void
}

export function TaskCard({
  id,
  title,
  status,
  estimatedMinutes,
  categoryId,
  frictionLevel,
  isRecurring,
  recurrenceType,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onComplete,
}: TaskCardProps) {
  const router = useRouter()
  const completeTask = useTaskStore((s) => s.completeTask)
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const [isPending, setIsPending] = useState(false)
  const [emotionalState, setEmotionalState] = useState<'idle' | 'completing' | 'error'>('idle')
  const categories = useCategoryStore((s) => s.categories)
  const taskCategory = categoryId ? categories.find((c) => c.id === categoryId) : null
  const isDone = status === 'completed'
  const dragRef = useRef<HTMLDivElement>(null)

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useGestures({
    onLongPress: () => {
      if (isDone || isPending) return
      router.push(`/focus/${id}`)
    },
    onSwipe: (direction) => {
      if (isDone || isPending || direction !== 'right') return
      handleToggleComplete()
    },
    onTap: () => {
      if (isDone || isPending) return
      handleToggleComplete()
    },
  })

  const handleToggleComplete = useCallback(async () => {
    if (isPending) return
    setEmotionalState('completing')
    setIsPending(true)
    hapticSoftTap()
    try {
      if (isDone) {
        await uncompleteTask(id)
      } else {
        await completeTask(id)
      }
      if (!isDone) onComplete?.(id)
      setEmotionalState('idle')
    } catch {
      setEmotionalState('error')
      setTimeout(() => setEmotionalState('idle'), 600)
    } finally {
      setIsPending(false)
    }
  }, [isPending, isDone, id, uncompleteTask, completeTask, onComplete])

  function handleDelete() {
    if (isPending) return
    useConfirmStore.getState().show({
      message: `Delete "${title}"?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setIsPending(true)
        try {
          await deleteTask(id)
        } finally {
          setIsPending(false)
        }
      },
    })
  }

  function handleDragStart(e: React.DragEvent) {
    onDragStart?.(e, id)
    hapticDragPickup()
  }

  function handleDragOver(e: React.DragEvent) {
    onDragOver?.(e, id)
  }

  function handleDrop(e: React.DragEvent) {
    onDrop?.(e, id)
    hapticDropCommit()
  }

  return (
    <motion.div
      layout
      variants={taskComplete}
      initial="initial"
      animate={isDone ? 'done' : 'initial'}
      role="listitem"
      className={`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        isDragTarget ? 'rounded-md bg-[var(--ambient-glow)]' : ''
      }`}
    >
      <div
        ref={dragRef}
        draggable={!isDone && !isPending}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        className={`group flex items-center gap-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          !isDone ? 'cursor-grab active:cursor-grabbing' : ''
        } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ touchAction: 'pan-y' }}
        tabIndex={isDone || isPending ? -1 : 0}
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
          onClick={handleToggleComplete}
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

        <div className="flex flex-1 items-center gap-2">
          <span
            className={`text-sm transition-all ${
              isDone
                ? 'text-[var(--text-muted)] line-through'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {title}
          </span>
          {!isDone && taskCategory && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px]"
              style={{
                backgroundColor: `${taskCategory.color}18`,
                color: taskCategory.color,
              }}
            >
              {taskCategory.emoji && <span className="mr-0.5">{taskCategory.emoji}</span>}
              {taskCategory.name}
            </span>
          )}
        </div>

        {!isDone && estimatedMinutes && (
          <span className="text-[10px] text-[var(--text-ghost)]">
            {estimatedMinutes}m
          </span>
        )}
        {!isDone && isRecurring && recurrenceType && recurrenceType !== 'none' && (
          <span className="text-[10px] text-[var(--accent)]/60">
            {recurrenceType === 'daily' ? 'Daily' : recurrenceType === 'weekdays' ? 'Weekdays' : 'Weekly'}
          </span>
        )}

        {!isDone && (
          <span className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-30"
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
