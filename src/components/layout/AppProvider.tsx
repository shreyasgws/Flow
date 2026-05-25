'use client'

import { useEffect, useRef } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useDriftStore } from '@/stores/driftStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useAuthStore } from '@/stores/authStore'
import { useDatabase } from '@/hooks/useDatabase'
import { useSync } from '@/hooks/useSync'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { processRecurringTasks } from '@/lib/recurring'
import { pullFromSupabase } from '@/lib/sync'
import { useUiStateStore } from '@/stores/uiStateStore'
import { Shell } from '@/components/layout/Shell'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase()
  const loadTasks = useTaskStore((s) => s.loadTasks)
  const loadSections = useFlowSectionStore((s) => s.loadSections)
  const loadDrift = useDriftStore((s) => s.loadEntries)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const initAuth = useAuthStore((s) => s.init)
  const needsPull = useAuthStore((s) => s.needsPull)
  const clearNeedsPull = useAuthStore((s) => s.clearNeedsPull)
  const loadUiState = useUiStateStore((s) => s.load)
  const initialized = useRef(false)

  useSync()
  useServiceWorker()

  useEffect(() => {
    if (!db.isReady || initialized.current) return
    initialized.current = true

    ;(async () => {
      await initAuth()
      loadUiState()

      const today = new Date().toISOString().slice(0, 10)
      loadTasks(today)
      loadSections()
      loadDrift()
      loadSettings()
      loadCategories()
    })()
  }, [db.isReady, initAuth, loadTasks, loadSections, loadDrift, loadSettings, loadCategories, loadUiState])

  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    if (!needsPull) return
    clearNeedsPull()
    pullFromSupabase().then(() => {
      const today = new Date().toISOString().slice(0, 10)
      loadTasks(today)
      loadSections()
      loadDrift()
      loadSettings()
      loadCategories()
    })
  }, [needsPull, clearNeedsPull, loadTasks, loadSections, loadDrift, loadSettings, loadCategories])

  useEffect(() => {
    if (!db.isReady) return
    const dayStartHour = settings.dayStartHour
    const now = new Date()
    const nextCheck = new Date(now)
    nextCheck.setHours(dayStartHour, 0, 0, 0)
    if (nextCheck <= now) nextCheck.setDate(nextCheck.getDate() + 1)

    const msUntilCheck = nextCheck.getTime() - now.getTime()

    const timer = setTimeout(async () => {
      try {
        await processRecurringTasks()
      } catch {
        // Will retry next scheduled check
      }
      const today = new Date().toISOString().slice(0, 10)
      loadTasks(today)
    }, msUntilCheck)

    return () => clearTimeout(timer)
  }, [db.isReady, loadTasks, settings.dayStartHour])

  if (db.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-8 text-center">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            Something unexpected happened
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            No data was lost. Try refreshing.
          </p>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {db.error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!db.isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div
          className="h-1 w-24 rounded-full bg-[var(--accent)]"
          style={{ opacity: 0.3, animation: 'pulse 2s ease-in-out infinite' }}
        />
      </div>
    )
  }

  return <Shell>{children}</Shell>
}
