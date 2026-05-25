import { TIERS, type DeviceTier } from './deviceTier'

function getTier(): DeviceTier {
  if (typeof document === 'undefined') return TIERS.FULL
  return (document.documentElement.dataset.tier as DeviceTier) ?? TIERS.FULL
}

const tier = () => getTier()
const isMinimal = () => tier() === TIERS.MINIMAL
const isFull = () => tier() === TIERS.FULL

export const SPRING_CONFIG = (): any => isMinimal()
  ? { type: 'tween', duration: 0.15, ease: 'linear' }
  : isFull()
    ? { type: 'spring', stiffness: 120, damping: 14, mass: 1 }
    : { type: 'spring', stiffness: 100, damping: 16, mass: 1 }

export const SHEET_SPRING = (): any => isMinimal()
  ? { type: 'tween', duration: 0.15, ease: 'linear' }
  : { type: 'spring', stiffness: 120, damping: 14 }

export const PAGE_TRANSITION = (): any => isMinimal()
  ? { duration: 0.15, ease: 'linear' }
  : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

export const DRAG_SPRING = (): any => isMinimal()
  ? { type: 'tween', duration: 0.15, ease: 'linear' }
  : { type: 'spring', stiffness: 200, damping: 20 }

export const EXPAND_CONFIG = (): any => ({
  duration: isMinimal() ? 0.1 : 0.2,
  ease: isMinimal() ? 'linear' : [0.22, 1, 0.36, 1],
})
