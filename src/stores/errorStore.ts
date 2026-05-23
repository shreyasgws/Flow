import { create } from 'zustand'

export type ErrorCategory = 'network' | 'database' | 'conflict' | 'unknown'

export interface FlowError {
  id: string
  category: ErrorCategory
  message: string
  description?: string
  retry?: () => void | Promise<void>
  dismissable?: boolean
  createdAt: number
}

const CATEGORY_MESSAGES: Record<ErrorCategory, { message: string; description: string }> = {
  network: {
    message: 'Something didn\'t go through',
    description: 'It might be a connection thing. Everything is saved locally.',
  },
  database: {
    message: 'Couldn\'t save that',
    description: 'Your data is safe locally. Try again when you\'re ready.',
  },
  conflict: {
    message: 'A change didn\'t sync',
    description: 'Both versions are kept. The most recent one is shown.',
  },
  unknown: {
    message: 'Something unexpected happened',
    description: 'No data was lost. You can try again.',
  },
}

interface ErrorStore {
  errors: FlowError[]
  push: (category: ErrorCategory, opts?: { retry?: () => void | Promise<void>; message?: string; description?: string }) => void
  dismiss: (id: string) => void
  clear: () => void
}

const AUTO_DISMISS_MS = 6000

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],

  push: (category, opts = {}) => {
    const defaults = CATEGORY_MESSAGES[category]
    const error: FlowError = {
      id: crypto.randomUUID(),
      category,
      message: opts.message ?? defaults.message,
      description: opts.description ?? defaults.description,
      retry: opts.retry,
      dismissable: true,
      createdAt: Date.now(),
    }
    set((s) => ({ errors: [...s.errors, error] }))

    setTimeout(() => {
      set((s) => ({ errors: s.errors.filter((e) => e.id !== error.id) }))
    }, AUTO_DISMISS_MS)
  },

  dismiss: (id) => {
    set((s) => ({ errors: s.errors.filter((e) => e.id !== id) }))
  },

  clear: () => {
    set({ errors: [] })
  },
}))
