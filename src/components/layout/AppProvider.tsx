'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useDriftStore } from '@/stores/driftStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useDatabase } from '@/hooks/useDatabase'
import { Shell } from '@/components/layout/Shell'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase()
  const loadTasks = useTaskStore((s) => s.loadTasks)
  const loadSections = useFlowSectionStore((s) => s.loadSections)
  const loadDrift = useDriftStore((s) => s.loadEntries)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadCategories = useCategoryStore((s) => s.loadCategories)

  useEffect(() => {
    if (!db.isReady) return

    const today = new Date().toISOString().slice(0, 10)
    loadTasks(today)
    loadSections()
    loadDrift()
    loadSettings()
    loadCategories()
  }, [db.isReady, loadTasks, loadSections, loadDrift, loadSettings, loadCategories])

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
