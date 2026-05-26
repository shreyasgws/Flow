'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useFocusStore } from '@/stores/focusStore'
import { useTaskStore } from '@/stores/taskStore'
import { AmbientBackground } from '@/components/focus/AmbientBackground'
import { FocusTimer } from '@/components/focus/TimerSetup'
import { FocusControls } from '@/components/focus/FocusControls'
import { SessionTransition } from '@/components/focus/SessionTransition'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useUiStateStore } from '@/stores/uiStateStore'
import type { Task } from '@/types'

export default function FocusPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)
  const router = useRouter()
  const tasks = useTaskStore((s) => s.tasks)
  const completeTask = useTaskStore((s) => s.completeTask)
  const sections = useFlowSectionStore((s) => s.sections)
  const enterFocus = useFocusStore((s) => s.enterFocus)
  const exitFocus = useFocusStore((s) => s.exitFocus)
  const timerConfig = useFocusStore((s) => s.timerConfig)
  const tick = useFocusStore((s) => s.tick)
  const [completed, setCompleted] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const tickRef = useRef(tick)
  tickRef.current = tick

  const task: Task | undefined = tasks.find((t) => t.id === taskId)
  const section = sections.find((s) => s.id === task?.flowSectionId)

  const setLastFocusTaskId = useUiStateStore((s) => s.setLastFocusTaskId)

  useEffect(() => {
    enterFocus(taskId)
    setLastFocusTaskId(taskId)
    const backTimer = setTimeout(() => setShowBack(true), 2000)
    return () => {
      clearTimeout(backTimer)
    }
  }, [taskId, enterFocus, setLastFocusTaskId])

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        exitFocus()
        router.back()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exitFocus, router])

  function handleBack() {
    exitFocus()
    router.back()
  }

  const handleComplete = useCallback(async () => {
    if (!task) return
    await completeTask(task.id)
    setCompleted(true)
  }, [task, completeTask])

  function handleWhatNext() {
    const activeTasks = useTaskStore.getState().tasks.filter(
      (t) => t.status === 'active',
    )
    const nextTask = activeTasks.length > 0
      ? activeTasks.sort((a, b) => a.sortOrder - b.sortOrder)[0]
      : undefined
    if (nextTask) {
      exitFocus()
      router.push(`/focus/${nextTask.id}`)
    } else {
      handleReturnToPlan()
    }
  }

  function handleTakeBreak() {
    const breakMin = timerConfig?.breakMinutes ?? 5
    useFocusStore.setState({
      phase: 'break',
      isBreak: true,
      secondsRemaining: breakMin * 60,
      isPaused: false,
    })
  }

  function handleReturnToPlan() {
    exitFocus()
    router.back()
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="h-1 w-24 animate-pulse rounded-full bg-[var(--accent)]" style={{ opacity: 0.3 }} />
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      role="application"
      aria-label="Focus mode"
    >
      <AmbientBackground />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: 'var(--vignette)' }}
      />

      {showBack && (
        <button
          onClick={handleBack}
          aria-label="Exit focus mode"
          className="fixed left-4 top-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--text-ghost)] opacity-20 transition-opacity hover:opacity-60"
          style={{ opacity: 0.2 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.2' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
      )}

      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div
            key="focus"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex w-full max-w-md flex-col items-center px-6"
          >
            {section && (
              <div
                className="mb-4 rounded-full px-3 py-1 text-[10px] tracking-wide"
                style={{
                  backgroundColor: `${section.atmosphereColor}20`,
                  color: section.atmosphereColor,
                }}
              >
                {section.name}
              </div>
            )}

            <p className="mb-8 text-center font-serif text-4xl font-light leading-snug text-[var(--text-primary)]" style={{ fontFamily: 'Fraunces, serif' }}>
              {task.title}
            </p>

            <FocusControls />

            <div className="mt-8">
              {!timerConfig && <FocusTimer onStart={() => {}} />}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleComplete}
                className="btn-secondary px-8 py-3 text-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center"
          >
            <SessionTransition
              onWhatNext={handleWhatNext}
              onReturnToPlan={handleReturnToPlan}
            />
            <div className="mt-3 flex justify-center gap-3">
              <button
                onClick={handleTakeBreak}
                className="btn-secondary px-6 py-2 text-sm"
              >
                Take a break
              </button>
            </div>
            <p className="mt-6 text-[10px] text-[var(--text-ghost)]">
              Session started at {new Date().toLocaleTimeString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
