'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { getUnfinishedYesterday, carryForwardTasks } from '@/lib/carryForward'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Task } from '@/types'

export function CarryForwardBanner() {
  const [pending, setPending] = useState(false)
  const [unfinished, setUnfinished] = useState<Task[]>([])
  const [dismissed, setDismissed] = useState(false)
  const loadTasks = useTaskStore((s) => s.loadTasks)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const today = new Date().toISOString().slice(0, 10)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  useEffect(() => {
    if (dismissed) return
    if (settings.carryForwardDismissedFor === today) {
      setDismissed(true)
      return
    }
    getUnfinishedYesterday().then((tasks) => {
      if (tasks.length === 0) {
        setDismissed(true)
        return
      }
      setUnfinished(tasks)
    })
  }, [today, dismissed, settings.carryForwardDismissedFor])

  const handleCarryForward = useCallback(async () => {
    if (pending) return
    setPending(true)
    try {
      const ids = unfinished.map((t) => t.id)
      const count = await carryForwardTasks(ids)
      if (count > 0) {
        await loadTasks(today)
      }
      setDismissed(true)
    } catch {
      /* silent */
    } finally {
      setPending(false)
    }
  }, [pending, unfinished, loadTasks, today])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    updateSettings({ carryForwardDismissedFor: today })
  }, [updateSettings, today])

  if (dismissed || unfinished.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mb-4 rounded-lg border border-[var(--accent)]/20 bg-[var(--bg-surface)] p-3"
      >
        <p className="text-sm text-[var(--text-primary)]">
          {unfinished.length} task{unfinished.length > 1 ? 's' : ''} from yesterday
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleCarryForward}
            disabled={pending}
            className="btn-primary px-4 py-1 text-xs"
          >
            {pending ? 'Moving...' : 'Carry them forward'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={pending}
            className="btn-secondary px-4 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
