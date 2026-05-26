import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { getDb } from '@/lib/db'
import { useErrorStore } from '@/stores/errorStore'
import { retryWithBackoff } from '@/lib/retry'
import { queueWrite } from '@/lib/sync'
import { useAuthStore } from '@/stores/authStore'

interface SettingsStore {
  settings: AppSettings
  isLoading: boolean
  error: string | null
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  reset: () => set({ settings: DEFAULT_SETTINGS, isLoading: false, error: null }),

  loadSettings: async () => {
    set({ isLoading: true, error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const stored = await retryWithBackoff(() => db.settings.toArray())
      if (stored.length > 0) {
        set({ settings: stored[0], isLoading: false })
      } else {
        await retryWithBackoff(() => db.settings.add(DEFAULT_SETTINGS))
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false, error: 'Failed to load settings' })
      useErrorStore.getState().push('database')
    }
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    set({ error: null })
    const { user } = useAuthStore.getState()
    const db = getDb(user?.id, user?.is_anonymous === true)
    try {
      const updated = { ...get().settings, ...partial }
      await retryWithBackoff(() => db.settings.put(updated))
      queueWrite('upsert', 'settings', updated.id, updated, db)
      set({ settings: updated })
    } catch {
      set({ error: 'Failed to save settings' })
      useErrorStore.getState().push('database')
    }
  },
}))
