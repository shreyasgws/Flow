export type EmotionalState = 'idle' | 'hover' | 'active' | 'completing' | 'error' | 'disabled' | 'empty'

export interface EmotionalTransition {
  state: EmotionalState
  duration: number
  ease: [number, number, number, number]
}

export const EMOTIONAL_TRANSITIONS: Record<string, EmotionalTransition> = {
  idle: { state: 'idle', duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  hover: { state: 'hover', duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  active: { state: 'active', duration: 0.1, ease: [0.4, 0, 0.2, 1] },
  completing: { state: 'completing', duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  error: { state: 'error', duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  disabled: { state: 'disabled', duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  empty: { state: 'empty', duration: 0.5, ease: [0.4, 0, 0.2, 1] },
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1]

export function emotionalMotionProps(state: EmotionalState) {
  switch (state) {
    case 'hover':
      return {
        scale: 1.02,
        transition: { duration: 0.15, ease: EASE },
      }
    case 'active':
      return {
        scale: 0.97,
        transition: { duration: 0.1, ease: EASE },
      }
    case 'completing':
      return {
        scale: [1, 1.05, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.4, ease: EASE },
      }
    case 'error':
      return {
        x: [0, -3, 3, -2, 2, 0],
        transition: { duration: 0.2, ease: EASE },
      }
    case 'disabled':
      return {
        opacity: 0.4,
        transition: { duration: 0.3, ease: EASE },
      }
    case 'empty':
      return {
        opacity: 0.6,
        transition: { duration: 0.5, ease: EASE },
      }
    default:
      return {
        scale: 1,
        transition: { duration: 0.3, ease: EASE },
      }
  }
}

export function emotionalRingStyles(state: EmotionalState) {
  switch (state) {
    case 'hover':
      return 'ring-1 ring-[var(--accent)]/30 transition-all duration-150'
    case 'active':
      return 'ring-2 ring-[var(--accent)]/50 transition-all duration-100'
    case 'completing':
      return 'ring-2 ring-[var(--accent)] transition-all duration-400'
    case 'error':
      return 'ring-2 ring-[var(--warn)] transition-all duration-200'
    case 'disabled':
      return 'opacity-40 pointer-events-none transition-opacity duration-300'
    case 'empty':
      return 'opacity-60 transition-opacity duration-500'
    default:
      return 'ring-0 transition-all duration-300'
  }
}

export function emotionalClasses(state: EmotionalState): string {
  switch (state) {
    case 'hover':
      return 'scale-[1.02] transition-transform duration-150 ease-soft'
    case 'active':
      return 'scale-[0.97] transition-transform duration-100 ease-soft'
    case 'completing':
      return 'animate-complete-pulse'
    case 'error':
      return 'animate-error-shake'
    case 'disabled':
      return 'opacity-40 pointer-events-none transition-opacity duration-300'
    case 'empty':
      return 'opacity-60 transition-opacity duration-500'
    default:
      return 'transition-all duration-300 ease-soft'
  }
}
