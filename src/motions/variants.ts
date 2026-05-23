import type { Variants } from 'motion/react'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

export const taskComplete: Variants = {
  initial: { scale: 1, opacity: 1 },
  done: {
    scale: 0.95,
    opacity: 0.6,
    transition: { duration: 0.3 },
  },
}

export const ambientPulse: Variants = {
  initial: { opacity: 0.6 },
  pulse: {
    opacity: [0.6, 0.8, 0.6],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}
