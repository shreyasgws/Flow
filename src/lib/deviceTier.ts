import { useEffect, useState, useRef } from 'react'

export const TIERS = {
  FULL: 'full',
  STANDARD: 'standard',
  MINIMAL: 'minimal',
} as const

export type DeviceTier = (typeof TIERS)[keyof typeof TIERS]

function runGPUBenchmark(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      const grad = ctx.createRadialGradient(100, 100, 0, 100, 100, 100)
      grad.addColorStop(0, 'rgba(200,131,42,0.1)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 200, 200)
    }
    return performance.now() - start < 8
  } catch {
    return false
  }
}

function detectTier(): DeviceTier {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = (navigator as any).connection?.saveData === true
  const slowConnection = ['slow-2g', '2g'].includes((navigator as any).connection?.effectiveType)

  if (prefersReducedMotion || saveData || slowConnection) return TIERS.MINIMAL

  const memory = (navigator as any).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4

  if (memory <= 1 || cores <= 2) return TIERS.MINIMAL

  if (memory <= 3 || cores <= 4) {
    return runGPUBenchmark() ? TIERS.STANDARD : TIERS.MINIMAL
  }

  return runGPUBenchmark() ? TIERS.FULL : TIERS.STANDARD
}

export function applyDeviceTier(): DeviceTier {
  if (typeof document === 'undefined') return TIERS.FULL

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = (navigator as any).connection?.saveData === true
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  try {
    const cached = localStorage.getItem('flow_device_tier')
    const cachedTime = localStorage.getItem('flow_device_tier_time')

    if (cached && cachedTime && Date.now() - Number(cachedTime) < sevenDays) {
      const tier: DeviceTier = (prefersReducedMotion || saveData) ? TIERS.MINIMAL : (cached as DeviceTier)
      document.documentElement.dataset.tier = tier
      return tier
    }
  } catch {}

  const tier = detectTier()
  document.documentElement.dataset.tier = tier

  try {
    localStorage.setItem('flow_device_tier', tier)
    localStorage.setItem('flow_device_tier_time', String(Date.now()))
  } catch {}

  return tier
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(TIERS.FULL)
  const appliedRef = useRef(false)

  useEffect(() => {
    const t = applyDeviceTier()
    setTier(t)
    appliedRef.current = true

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => {
      const newTier = mql.matches ? TIERS.MINIMAL : (appliedRef.current ? applyDeviceTier() : TIERS.FULL)
      document.documentElement.dataset.tier = newTier
      setTier(newTier)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return tier
}

export function getTierBooleans(tier: DeviceTier) {
  return {
    isFull: tier === TIERS.FULL,
    isStandard: tier === TIERS.STANDARD,
    isMinimal: tier === TIERS.MINIMAL,
    hasSpring: tier !== TIERS.MINIMAL,
    hasBlur: tier === TIERS.FULL,
    hasAmbient: tier !== TIERS.MINIMAL,
    hasCanvas: tier !== TIERS.MINIMAL,
    hasParticles: tier === TIERS.FULL,
    hasGrain: tier === TIERS.FULL,
    hasStagger: tier !== TIERS.MINIMAL,
  }
}
