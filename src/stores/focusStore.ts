import { create } from 'zustand'

export type TimerPreset = 'classic' | 'long_focus' | 'deep_work' | 'custom'

export interface TimerConfig {
  preset: TimerPreset
  workMinutes: number
  breakMinutes: number
}

export const TIMER_PRESETS: Record<Exclude<TimerPreset, 'custom'>, TimerConfig> = {
  classic: { preset: 'classic', workMinutes: 25, breakMinutes: 5 },
  long_focus: { preset: 'long_focus', workMinutes: 50, breakMinutes: 10 },
  deep_work: { preset: 'deep_work', workMinutes: 90, breakMinutes: 20 },
}

export type FocusPhase = 'focus' | 'break'

interface FocusStore {
  activeTaskId: string | null
  startedAt: number | null
  elapsedSeconds: number
  timerConfig: TimerConfig | null
  phase: FocusPhase
  secondsRemaining: number | null
  isPaused: boolean
  isBreak: boolean

  enterFocus: (taskId: string) => void
  exitFocus: () => void
  setTimerConfig: (config: TimerConfig) => void
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  cancelTimer: () => void
  tick: () => void
  completePhase: () => void
  setPhase: (phase: FocusPhase) => void
}

export const useFocusStore = create<FocusStore>((set, get) => ({
  activeTaskId: null,
  startedAt: null,
  elapsedSeconds: 0,
  timerConfig: null,
  phase: 'focus',
  secondsRemaining: null,
  isPaused: false,
  isBreak: false,

  enterFocus: (taskId: string) => {
    set({
      activeTaskId: taskId,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      timerConfig: null,
      phase: 'focus',
      secondsRemaining: null,
      isPaused: false,
      isBreak: false,
    })
  },

  exitFocus: () => {
    set({
      activeTaskId: null,
      startedAt: null,
      elapsedSeconds: 0,
      timerConfig: null,
      phase: 'focus',
      secondsRemaining: null,
      isPaused: false,
      isBreak: false,
    })
  },

  setTimerConfig: (config: TimerConfig) => {
    set({
      timerConfig: config,
      secondsRemaining: config.workMinutes * 60,
      phase: 'focus',
      isBreak: false,
    })
  },

  startTimer: () => {
    set({ isPaused: false })
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resumeTimer: () => {
    set({ isPaused: false })
  },

  cancelTimer: () => {
    set({
      timerConfig: null,
      secondsRemaining: null,
      isPaused: false,
      phase: 'focus',
      isBreak: false,
    })
  },

  tick: () => {
    const state = get()
    if (state.isPaused || state.activeTaskId === null) return

    set((s) => ({
      elapsedSeconds: s.elapsedSeconds + 1,
    }))

    if (state.secondsRemaining !== null && state.secondsRemaining > 0) {
      set((s) => ({
        secondsRemaining: s.secondsRemaining! - 1,
      }))
    }
  },

  completePhase: () => {
    const state = get()
    if (state.phase === 'focus') {
      set({
        phase: 'break',
        isBreak: true,
        secondsRemaining: (state.timerConfig?.breakMinutes ?? 5) * 60,
        isPaused: false,
      })
    } else {
      set({
        phase: 'focus',
        isBreak: false,
        timerConfig: null,
        secondsRemaining: null,
        isPaused: false,
      })
    }
  },

  setPhase: (phase: FocusPhase) => {
    set({ phase })
  },
}))
