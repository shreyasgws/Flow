'use client'

import { useEffect, useRef } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useDriftStore } from '@/stores/driftStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useTemplateStore } from '@/stores/templateStore'
import { useReflectionStore } from '@/stores/reflectionStore'
import { useAuthStore, registerResetAllStores } from '@/stores/authStore'
import { useDatabase } from '@/hooks/useDatabase'
import { useSync } from '@/hooks/useSync'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { processRecurringTasks } from '@/lib/recurring'
import { pullFromSupabase } from '@/lib/sync'
import { useUiStateStore } from '@/stores/uiStateStore'
import { seedDefaultSections } from '@/lib/db'
import { Shell } from '@/components/layout/Shell'

function loadLocalData() {
  const today = new Date().toISOString().slice(0, 10)
  useUiStateStore.getState().load()
  useTaskStore.getState().loadTasks(today)
  useFlowSectionStore.getState().loadSections()
  useDriftStore.getState().loadEntries()
  useSettingsStore.getState().loadSettings()
  useCategoryStore.getState().loadCategories()
  useTemplateStore.getState().loadTemplates()
  useReflectionStore.getState().loadReflections()
}

async function loadAuthenticatedData(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    // First pull from Supabase (merge into Dexie)
    await pullFromSupabase(userId, false)
  } catch {
    // Supabase pull failed — local data is preserved
  }
  // Then seed defaults if needed (no-op if sections exist)
  await seedDefaultSections(userId, false)
  // Then load everything from Dexie (now has merged data)
  useUiStateStore.getState().load()
  useTaskStore.getState().loadTasks(today)
  useFlowSectionStore.getState().loadSections()
  useDriftStore.getState().loadEntries()
  useSettingsStore.getState().loadSettings()
  useCategoryStore.getState().loadCategories()
  useTemplateStore.getState().loadTemplates()
  useReflectionStore.getState().loadReflections()
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase()
  const initAuth = useAuthStore((s) => s.init)
  const user = useAuthStore((s) => s.user)
  const isReady = useAuthStore((s) => s.isReady)
  const initialized = useRef(false)
  const prevUserId = useRef<string | null>(null)

  useSync()
  useServiceWorker()

  // Register global reset — called by authStore on login/logout
  useEffect(() => {
    registerResetAllStores(() => {
      useTaskStore.getState().reset()
      useFlowSectionStore.getState().reset()
      useDriftStore.getState().reset()
      useSettingsStore.getState().reset()
      useCategoryStore.getState().reset()
      useTemplateStore.getState().reset()
      useReflectionStore.getState().reset()
      useUiStateStore.getState().reset()
    })
  }, [])

  // Initialize auth
  useEffect(() => {
    if (!db.isReady || initialized.current) return
    initialized.current = true
    initAuth()
  }, [db.isReady, initAuth])

  // When auth is ready, load data for the current user
  useEffect(() => {
    if (!db.isReady || !isReady) return

    const currentId = user?.id ?? null
    const previousId = prevUserId.current
    prevUserId.current = currentId

    // Skip if same user (prevents re-fetch on unrelated re-renders)
    if (currentId === previousId && previousId !== null) return

    if (user && !user.is_anonymous) {
      // Authenticated user
      loadAuthenticatedData(user.id)
    } else {
      // Anonymous or no user
      seedDefaultSections()
      loadLocalData()
    }
  }, [user, isReady, db.isReady])

  const settings = useSettingsStore((s) => s.settings)

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
      useTaskStore.getState().loadTasks(today)
    }, msUntilCheck)

    return () => clearTimeout(timer)
  }, [db.isReady, settings.dayStartHour])

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
