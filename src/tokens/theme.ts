export const themeTokens = {
  surfaces: {
    base: 'var(--bg-base)',
    surface: 'var(--bg-surface)',
    elevated: 'var(--bg-elevated)',
    overlay: 'var(--bg-overlay)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    ghost: 'var(--text-ghost)',
  },
  accent: 'var(--accent)',
  warn: 'var(--warn)',
  ambient: {
    glow: 'var(--ambient-glow)',
    noise: 'var(--ambient-noise)',
    tint: 'var(--ambient-tint)',
  },
  spacing: {
    density: 'var(--spacing-density)',
  },
  motion: {
    intensity: 'var(--motion-intensity)',
  },
  blur: 'var(--blur-level)',
} as const

export const motionTiming = {
  micro: 120,
  ui: 220,
  environmental: 400,
  ambient: 800,
} as const

export type MotionPreset = 'micro' | 'ui' | 'environmental' | 'ambient'

export const easing = {
  soft: [0.4, 0, 0.2, 1] as const,
  breathing: [0.45, 0, 0.55, 1] as const,
  still: [0, 0, 1, 1] as const,
}
