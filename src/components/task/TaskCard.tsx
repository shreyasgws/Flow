'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { useConfirmStore } from '@/stores/confirmStore'
import { taskComplete } from '@/motions/variants'
import { useCategoryStore } from '@/stores/categoryStore'
import { useGestures } from '@/hooks/useGestures'

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
    setIsPending(true)
    try {
      if (isDone) {
        await uncompleteTask(id)
      } else {
        await completeTask(id)
      }
      if (!isDone) onComplete?.(id)
    } catch {
      setTimeout(() => {}, 600)
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
        className={`group/task flex items-center gap-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          !isDone ? 'cursor-grab active:cursor-grabbing' : ''
        } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ touchAction: 'pan-y' }}
        tabIndex={isDone || isPending ? -1 : 0}
      >
        <motion.button
          onClick={handleToggleComplete}
          disabled={isPending}
          aria-label={isDone ? `Uncomplete "${title}"` : `Complete "${title}"`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
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

        {/* Metadata — hidden by default, shown on hover/focus */}
        <span className="task-card-metadata items-center gap-1.5">
          {estimatedMinutes && (
            <span className="text-[10px] text-[var(--text-ghost)]">
              {estimatedMinutes}m
            </span>
          )}
          {!isDone && isRecurring && recurrenceType && recurrenceType !== 'none' && (
            <span className="text-[10px] text-[var(--accent)]/60">
              {recurrenceType === 'daily' ? 'Daily' : recurrenceType === 'weekdays' ? 'Weekdays' : 'Weekly'}
            </span>
          )}
          {!isDone && taskCategory && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px]"
              style={{
                backgroundColor: `${taskCategory.color}18`,
                color: taskCategory.color,
              }}
            >
              {taskCategory.emoji && <span className="mr-0.5">{taskCategory.emoji}</span>}
              {taskCategory.name}
            </span>
          )}
        </span>

        {/* Actions — hidden by default, shown on hover/focus */}
        <span className="task-card-metadata items-center gap-0">
          {!isFirst && (
            <button
              onClick={() => onMoveUp?.(id)}
              aria-label="Move task up"
              className="btn-ghost"
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
              className="btn-ghost"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <path d="M6 3v6M3 6l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete "${title}"`}
            className="btn-ghost disabled:opacity-30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              aria-hidden="true"
            >
              <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      </div>
    </motion.div>
  )
}
