import { TIERS } from './deviceTier'

let transitionActive = false

function getIsMinimal(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.tier === TIERS.MINIMAL
}

export function startTransition() {
  if (getIsMinimal()) return
  transitionActive = true
  document.documentElement.classList.add('transitioning')
}

export function endTransition() {
  transitionActive = false
  document.documentElement.classList.remove('transitioning')
}

export function isTransitioning() {
  return transitionActive
}

export function useTransitionPause() {
  if (typeof window === 'undefined') return
  const observer = new MutationObserver(() => {
    if (document.documentElement.classList.contains('transitioning')) {
      transitionActive = true
    } else {
      transitionActive = false
    }
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
