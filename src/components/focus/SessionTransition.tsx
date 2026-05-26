'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useFocusStore } from '@/stores/focusStore'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'

interface SessionTransitionProps {
  onWhatNext: () => void
  onReturnToPlan: () => void
}

export function SessionTransition({ onWhatNext, onReturnToPlan }: SessionTransitionProps) {
  const activeTaskId = useFocusStore((s) => s.activeTaskId)
  const tasks = useTaskStore((s) => s.tasks)
  const sections = useFlowSectionStore((s) => s.sections)

  const completedTask = tasks.find((t) => t.id === activeTaskId)
  const activeTasks = tasks.filter((t) => t.status === 'active')
  const currentSection = sections.find((s) => s.id === completedTask?.flowSectionId)
  const remainingInSection = activeTasks.filter(
    (t) => t.flowSectionId === completedTask?.flowSectionId,
  )
  const isAllDone = activeTasks.length === 0
  const isLate = new Date().getHours() >= 21

  const nextTask = remainingInSection.length > 0
    ? remainingInSection.sort((a, b) => a.sortOrder - b.sortOrder)[0]
    : null

  function getPromptContent() {
    if (isAllDone) {
      return {
        title: 'Everything done.',
        subtitle: 'How did today feel?',
        actions: [
          { label: 'Good', action: () => {} },
          { label: 'Okay', action: () => {} },
          { label: 'Rough', action: () => {} },
        ],
      }
    }
    if (isLate) {
      return {
        title: 'That is one less thing.',
        subtitle: '',
        actions: [
          { label: 'Keep going', action: onWhatNext },
          { label: 'Carry rest forward', action: onReturnToPlan },
        ],
      }
    }
    if (nextTask) {
      return {
        title: `Up next: ${nextTask.title}`,
        subtitle: '',
        actions: [
          { label: 'Start', action: onWhatNext },
          { label: 'Skip', action: onReturnToPlan },
        ],
      }
    }
    return {
      title: `${currentSection?.name ?? 'Section'} done.`,
      subtitle: `The rest of the day has ${activeTasks.length} tasks waiting.`,
      actions: [
        { label: 'Continue', action: onReturnToPlan },
      ],
    }
  }

  const prompt = getPromptContent()

  return (
    <div className="mt-6 text-center" onClick={(e) => e.stopPropagation()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          width="32" height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          className="mx-auto mb-3"
        >
          <motion.path
            d="M8 16l5 5L24 11"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <p className={`font-serif text-lg ${isAllDone ? 'text-[22px]' : ''} text-[var(--text-primary)]`}>
          {prompt.title}
        </p>
        {prompt.subtitle && (
          <p className="text-sm text-[var(--text-secondary)]">{prompt.subtitle}</p>
        )}
        <div className="flex justify-center gap-3 pt-2">
          {prompt.actions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="btn-secondary px-6 py-2 text-sm"
            >
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>

      <button
        onClick={onReturnToPlan}
        className="mt-4 btn-ghost text-xs"
      >
        Dismiss
      </button>
    </div>
  )
}
