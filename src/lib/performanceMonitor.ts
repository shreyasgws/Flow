import { TIERS } from './deviceTier'

let frameCount = 0
let lastTime = 0
let lowFPSCount = 0
let rafId = 0
let running = false
const LOW_FPS_THRESHOLD = 25
const LOW_FPS_STRIKES = 5

export function startPerformanceMonitor() {
  if (typeof document === 'undefined') return
  const tier = document.documentElement.dataset.tier
  if (tier !== TIERS.STANDARD || running) return

  running = true
  lastTime = performance.now()
  loop()
}

export function stopPerformanceMonitor() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  running = false
  frameCount = 0
  lastTime = 0
  lowFPSCount = 0
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
        document.documentElement.dataset.tier = nextTier
        stopPerformanceMonitor()
        lowFPSCount = 0
      }
    } else {
      lowFPSCount = 0
    }
  }

  if (running) rafId = requestAnimationFrame(loop)
}
