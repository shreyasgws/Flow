'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDriftStore } from '@/stores/driftStore'
import { useTaskStore } from '@/stores/taskStore'
import { DriftCard } from './DriftCard'
import { DriftInput } from './DriftInput'

interface DriftPanelProps {
  open: boolean
  onClose: () => void
}

export function DriftPanel({ open, onClose }: DriftPanelProps) {
  const entries = useDriftStore((s) => s.entries)
  const loadEntries = useDriftStore((s) => s.loadEntries)
  const archiveEntry = useDriftStore((s) => s.archiveEntry)
  const addTask = useTaskStore((s) => s.addTask)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    if (open) loadEntries()
  }, [open, loadEntries])

  const handleConvert = useCallback(async (text: string, driftId: string) => {
    setConverting(text)
    try {
      const task = await addTask({
        title: text,
        flowSectionId: null,
        date: new Date().toISOString().slice(0, 10),
        sortOrder: 0,
        estimatedMinutes: null,
        isRecurring: false,
        sourceDriftId: driftId,
        frictionLevel: null,
        focusWindowStart: null,
        focusWindowEnd: null,
        completedAt: null,
      })
      if (task) await archiveEntry(driftId)
    } finally {
      setConverting(null)
    }
  }, [addTask, archiveEntry])

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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl bg-[var(--bg-surface)] pb-8 shadow-xl"
          >
            <div className="mx-auto mb-2 mt-3 h-1 w-8 rounded-full bg-[var(--text-ghost)]" />

            <div className="px-5">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Drift</h2>
              <DriftInput />

              <div className="mt-2 max-h-[50vh] space-y-1 overflow-y-auto">
                {entries.length === 0 && (
                  <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                    No drift yet. Thoughts appear here.
                  </p>
                )}

                <AnimatePresence mode="popLayout">
                  {entries.map((entry) => (
                    <DriftCard
                      key={entry.id}
                      entry={entry}
                      onConvert={handleConvert}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {converting && (
                <p className="pt-2 text-center text-[10px] text-[var(--text-muted)]">
                  Added as task
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
