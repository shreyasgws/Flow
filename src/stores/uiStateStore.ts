import { create } from 'zustand'
import { persistUiState, getUiState, setSessionState, getSessionState } from '@/lib/uiState'

interface UiState {
  lastActiveDate: string
  lastFocusTaskId: string | null
  composerDraft: string
  sectionsExpanded: Record<string, boolean>
  showCompletedTasks: boolean
  loaded: boolean
}

interface UiStateStore {
  ui: UiState
  load: () => Promise<void>
  setLastActiveDate: (date: string) => void
  setLastFocusTaskId: (id: string | null) => void
  setComposerDraft: (text: string) => void
  setSectionExpanded: (sectionId: string, expanded: boolean) => void
  setShowCompletedTasks: (show: boolean) => void
  reset: () => void
}

const initialUi: UiState = {
  lastActiveDate: new Date().toISOString().slice(0, 10),
  lastFocusTaskId: null,
  composerDraft: '',
  sectionsExpanded: {},
  showCompletedTasks: false,
  loaded: false,
}

export const useUiStateStore = create<UiStateStore>((set, get) => ({
  ui: { ...initialUi },

  reset: () => set({ ui: { ...initialUi } }),

  load: async () => {
    const lastActiveDate = await getUiState<string>('lastActiveDate')
    const lastFocusTaskId = await getUiState<string | null>('lastFocusTaskId')
    const showCompletedTasks = await getUiState<boolean>('showCompletedTasks')
    const sectionsExpanded = await getUiState<Record<string, boolean>>('sectionsExpanded')
    const composerDraft = getSessionState<string>('composerDraft') || ''

    set({
      ui: {
        lastActiveDate: lastActiveDate || get().ui.lastActiveDate,
        lastFocusTaskId: lastFocusTaskId || null,
        composerDraft,
        sectionsExpanded: sectionsExpanded || {},
        showCompletedTasks: showCompletedTasks || false,
        loaded: true,
      },
    })
  },

  setLastActiveDate: (date: string) => {
    set((s) => ({ ui: { ...s.ui, lastActiveDate: date } }))
    persistUiState('lastActiveDate', date)
  },

  setLastFocusTaskId: (id: string | null) => {
    set((s) => ({ ui: { ...s.ui, lastFocusTaskId: id } }))
    persistUiState('lastFocusTaskId', id)
  },

  setComposerDraft: (text: string) => {
    set((s) => ({ ui: { ...s.ui, composerDraft: text } }))
    setSessionState('composerDraft', text)
  },

  setSectionExpanded: (sectionId: string, expanded: boolean) => {
    set((s) => ({
      ui: {
        ...s.ui,
        sectionsExpanded: { ...s.ui.sectionsExpanded, [sectionId]: expanded },
      },
    }))
    persistUiState('sectionsExpanded', { ...get().ui.sectionsExpanded })
  },

  setShowCompletedTasks: (show: boolean) => {
    set((s) => ({ ui: { ...s.ui, showCompletedTasks: show } }))
    persistUiState('showCompletedTasks', show)
  },
}))
