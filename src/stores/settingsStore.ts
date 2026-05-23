import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { db } from '@/lib/db'

interface SettingsStore {
  settings: AppSettings
  isLoading: boolean
  error: string | null
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const stored = await db.settings.toArray()
      if (stored.length > 0) {
        set({ settings: stored[0], isLoading: false })
      } else {
        await db.settings.add(DEFAULT_SETTINGS)
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false, error: 'Failed to load settings' })
    }
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    set({ error: null })
    try {
      const updated = { ...get().settings, ...partial }
      await db.settings.put(updated)
      set({ settings: updated })
    } catch {
      set({ error: 'Failed to save settings' })
    }
  },
}))
