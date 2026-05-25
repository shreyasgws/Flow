import { TIERS } from './deviceTier'

let frameCount = 0
let lastTime = 0
let lowFPSCount = 0
const LOW_FPS_THRESHOLD = 25
const LOW_FPS_STRIKES = 5

export function startPerformanceMonitor() {
  if (typeof document === 'undefined') return
  const tier = document.documentElement.dataset.tier
  if (tier !== TIERS.STANDARD) return

  lastTime = performance.now()
  loop()
}

function loop() {
  frameCount++
  const now = performance.now()

  if (now - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime))
    frameCount = 0
    lastTime = now

    if (fps < LOW_FPS_THRESHOLD) {
      lowFPSCount++
      if (lowFPSCount >= LOW_FPS_STRIKES) {
        const currentTier = document.documentElement.dataset.tier
        const nextTier = currentTier === TIERS.FULL ? TIERS.STANDARD : TIERS.MINIMAL
        try {
          localStorage.setItem('flow_device_tier', nextTier)
          localStorage.setItem('flow_device_tier_time', String(Date.now()))
        } catch {}
        lowFPSCount = 0
      }
    } else {
      lowFPSCount = 0
    }
  }

  requestAnimationFrame(loop)
}
