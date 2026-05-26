'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTemplateStore } from '@/stores/templateStore'
import { useTaskStore } from '@/stores/taskStore'
import type { TemplateTask } from '@/types'

interface TemplatePickerProps {
  open: boolean
  onClose: () => void
  date: string
  onApplied: () => void
}

export function TemplatePicker({ open, onClose, date, onApplied }: TemplatePickerProps) {
  const templates = useTemplateStore((s) => s.templates)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)
  const addTask = useTaskStore((s) => s.addTask)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    if (open) loadTemplates()
  }, [open, loadTemplates])

  async function handleApply(templateId: string, tasks: TemplateTask[]) {
    setApplying(templateId)
    try {
      for (let i = 0; i < tasks.length; i++) {
        await addTask({
          title: tasks[i].title,
          flowSectionId: tasks[i].flowSectionId,
          date,
          sortOrder: i,
          estimatedMinutes: null,
          isRecurring: false,
          recurrenceType: 'none',
          recurrenceBaseId: null,
          sourceDriftId: null,
          frictionLevel: null,
          focusWindowStart: null,
          focusWindowEnd: null,
          completedAt: null,
        })
      }
      onApplied()
      onClose()
    } finally {
      setApplying(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '60%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '60%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] rounded-t-2xl bg-[var(--bg-surface)] pb-8 shadow-xl"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-8 rounded-full bg-[var(--text-ghost)]" />
            <div className="px-6">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                Apply Template
              </h2>

              {templates.length === 0 && (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No templates yet. Save a day as a template from your plan.
                </p>
              )}

              <div className="max-h-[40vh] space-y-1 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleApply(t.id, t.tasks)}
                    disabled={applying === t.id}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50"
                  >
                    <span>{t.name}</span>
                    <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                      {t.tasks.length} tasks
                    </span>
                    {applying === t.id && (
                      <span className="ml-2 text-[10px] text-[var(--accent)]">Applying…</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
