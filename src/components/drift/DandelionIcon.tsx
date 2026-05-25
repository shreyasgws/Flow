'use client'

import { useEffect, useRef } from 'react'
import { useDeviceTier, getTierBooleans } from '@/lib/deviceTier'

const stems = [
  { angle: -Math.PI / 2, baseLen: 11, baseOp: 0.92, phase: 0 },
  { angle: -Math.PI / 4, baseLen: 10, baseOp: 0.76, phase: (Math.PI * 2) / 8 * 1 },
  { angle: 0, baseLen: 10, baseOp: 0.60, phase: (Math.PI * 2) / 8 * 2 },
  { angle: Math.PI / 4, baseLen: 9, baseOp: 0.44, phase: (Math.PI * 2) / 8 * 3 },
  { angle: Math.PI / 2, baseLen: 8, baseOp: 0.30, phase: (Math.PI * 2) / 8 * 4 },
  { angle: (3 * Math.PI) / 4, baseLen: 9, baseOp: 0.26, phase: (Math.PI * 2) / 8 * 5 },
  { angle: Math.PI, baseLen: 10, baseOp: 0.50, phase: (Math.PI * 2) / 8 * 6 },
  { angle: (-3 * Math.PI) / 4, baseLen: 10, baseOp: 0.66, phase: (Math.PI * 2) / 8 * 7 },
]

const CX = 20
const CY = 20

function easeOutCubic(x: number) { return 1 - Math.pow(1 - x, 3) }
function springFn(x: number) {
  const s = 1.5
  return Math.pow(2, -10 * x) * Math.sin((x - s / 4) * (2 * Math.PI) / s) + 1
}

function DandelionStatic() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="2.2" fill="rgba(240,239,232,0.92)" />
      <line x1="14" y1="11.8" x2="14" y2="3" stroke="rgba(240,239,232,0.90)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="14" cy="2.5" r="1.2" fill="rgba(240,239,232,0.90)" />
      <line x1="15.5" y1="12.5" x2="21" y2="7" stroke="rgba(240,239,232,0.76)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="21.5" cy="6.5" r="1.1" fill="rgba(240,239,232,0.76)" />
      <line x1="16.2" y1="14" x2="24" y2="14" stroke="rgba(240,239,232,0.60)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="24.5" cy="14" r="1.0" fill="rgba(240,239,232,0.60)" />
      <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" stroke="rgba(240,239,232,0.44)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="21" cy="21" r="0.9" fill="rgba(240,239,232,0.44)" />
      <line x1="14" y1="16.2" x2="14" y2="23" stroke="rgba(240,239,232,0.30)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="14" cy="23.5" r="0.8" fill="rgba(240,239,232,0.30)" />
      <line x1="12.5" y1="15.5" x2="7.5" y2="20.5" stroke="rgba(240,239,232,0.26)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7" cy="21" r="0.7" fill="rgba(240,239,232,0.26)" />
      <line x1="11.8" y1="14" x2="4" y2="14" stroke="rgba(240,239,232,0.50)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="3.5" cy="14" r="0.9" fill="rgba(240,239,232,0.50)" />
      <line x1="12.5" y1="12.5" x2="7" y2="7" stroke="rgba(240,239,232,0.66)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="6.5" cy="6.5" r="1.05" fill="rgba(240,239,232,0.66)" />
    </svg>
  )
}

function DandelionCanvas({ triggerBurst }: { triggerBurst: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ t: 0, bursting: false, burstT: 0, rafId: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = 40 * dpr
    canvas.height = 40 * dpr
    canvas.style.width = '40px'
    canvas.style.height = '40px'
    ctx.scale(dpr, dpr)

    function draw() {
      const state = stateRef.current
      const c = ctx!
      c.clearRect(0, 0, 40, 40)

      state.t += 0.022

      let extraLen = 0
      let opMul = 1

      if (state.bursting) {
        state.burstT += 0.016
        const BURST_OUT = 0.38
        const BURST_HOLD = 0.12
        const BURST_IN = 0.55
        const total = BURST_OUT + BURST_HOLD + BURST_IN

        if (state.burstT >= total) {
          state.bursting = false
          state.burstT = 0
        } else if (state.burstT < BURST_OUT) {
          const p = state.burstT / BURST_OUT
          extraLen = easeOutCubic(p) * 9
          opMul = 1 - easeOutCubic(p) * 0.3
        } else if (state.burstT < BURST_OUT + BURST_HOLD) {
          extraLen = 9
          opMul = 0.7
        } else {
          const p = (state.burstT - BURST_OUT - BURST_HOLD) / BURST_IN
          const sv = springFn(p)
          extraLen = Math.max(0, (1 - sv) * 9)
          opMul = 0.7 + sv * 0.3
        }
      }

      stems.forEach((stem) => {
        const sway = Math.sin(state.t + stem.phase) * 0.07
        const breathe = Math.sin(state.t * 0.7 + stem.phase) * 1.3
        const staggeredExtra = extraLen * (1 + stems.indexOf(stem) * 0.03)

        const angle = stem.angle + sway
        const len = stem.baseLen + breathe + staggeredExtra
        const ex = CX + Math.cos(angle) * len
        const ey = CY + Math.sin(angle) * len

        c.beginPath()
        c.moveTo(CX, CY)
        c.lineTo(ex, ey)
        c.strokeStyle = `rgba(240,239,232,${(stem.baseOp * opMul * 0.75).toFixed(3)})`
        c.lineWidth = 1
        c.lineCap = 'round'
        c.stroke()

        const tipR = 1.2 + Math.sin(state.t * 0.9 + stem.phase) * 0.35
        c.beginPath()
        c.arc(ex, ey, tipR, 0, Math.PI * 2)
        c.fillStyle = `rgba(240,239,232,${(stem.baseOp * opMul).toFixed(3)})`
        c.fill()
      })

      const coreR = 2.1 + Math.sin(state.t * 1.1) * 0.28 + (state.bursting ? extraLen * 0.05 : 0)
      c.beginPath()
      c.arc(CX, CY, coreR, 0, Math.PI * 2)
      c.fillStyle = 'rgba(240,239,232,0.93)'
      c.fill()

      state.rafId = requestAnimationFrame(draw)
    }

    stateRef.current.rafId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(stateRef.current.rafId)
  }, [])

  useEffect(() => {
    if (triggerBurst) {
      stateRef.current.bursting = true
      stateRef.current.burstT = 0
    }
  }, [triggerBurst])

  return <canvas ref={canvasRef} width={40} height={40} />
}

export function DandelionIcon({ triggerBurst = false }: { triggerBurst?: boolean }) {
  const tier = useDeviceTier()
  const { isMinimal } = getTierBooleans(tier)

  if (isMinimal) return <DandelionStatic />

  return <DandelionCanvas triggerBurst={triggerBurst} />
}
