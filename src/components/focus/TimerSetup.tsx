'use client'

import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { useFocusStore, TIMER_PRESETS } from '@/stores/focusStore'
import type { TimerConfig, TimerPreset } from '@/stores/focusStore'

const PRESET_BUTTONS: { key: Exclude<TimerPreset, 'custom'>; label: string; sub: string }[] = [
  { key: 'classic', label: 'Classic', sub: '25 / 5' },
  { key: 'long_focus', label: 'Long Focus', sub: '50 / 10' },
  { key: 'deep_work', label: 'Deep Work', sub: '90 / 20' },
]

interface TimerDialProps {
  minutes: number
  onChange: (m: number) => void
}

function TimerDial({ minutes, onChange }: TimerDialProps) {
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const fraction = minutes / 180

  function handlePointerDown(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    function onMove(me: PointerEvent) {
      const dx = me.clientX - cx
      const dy = me.clientY - cy
      const angle = Math.atan2(dy, dx) + Math.PI / 2
      const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const pct = normalized / (2 * Math.PI)
      const val = Math.max(1, Math.min(180, Math.round(pct * 180)))
      onChange(val)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="260" height="260" className="-rotate-90">
        <circle
          cx="130" cy="130" r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth="6"
        />
        <circle
          cx="130" cy="130" r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          strokeLinecap="round"
          className="transition-all duration-200"
        />
      </svg>
      <div
        className="absolute inset-0 flex cursor-pointer items-center justify-center"
        onPointerDown={handlePointerDown}
      >
        <div className="select-none text-center">
          <span className="font-mono text-5xl tracking-tight text-[var(--text-primary)]">
            {minutes}
          </span>
          <p className="text-xs text-[var(--text-muted)]">minutes</p>
        </div>
      </div>
    </div>
  )
}

interface FocusTimerProps {
  onStart?: () => void
}

export function FocusTimer(_props: FocusTimerProps) {
  const setTimerConfig = useFocusStore((s) => s.setTimerConfig)
  const timerConfig = useFocusStore((s) => s.timerConfig)
  const [customMinutes, setCustomMinutes] = useState(30)
  const [showDial, setShowDial] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset | null>(null)

  const handlePreset = useCallback((key: Exclude<TimerPreset, 'custom'>) => {
    setSelectedPreset(key)
    const config = TIMER_PRESETS[key]
    setTimerConfig(config)
  }, [setTimerConfig])

  const handleCustom = useCallback(() => {
    setShowDial(true)
    setSelectedPreset(null)
  }, [])

  const handleCustomConfirm = useCallback(() => {
    const config: TimerConfig = {
      preset: 'custom',
      workMinutes: customMinutes,
      breakMinutes: 5,
    }
    setTimerConfig(config)
    setShowDial(false)
  }, [customMinutes, setTimerConfig])

  if (timerConfig) {
    return null
  }

  if (showDial) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <TimerDial minutes={customMinutes} onChange={setCustomMinutes} />
        <div className="flex gap-3">
          <button
            onClick={handleCustomConfirm}
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            Set {customMinutes} min
          </button>
          <button
            onClick={() => setShowDial(false)}
            className="rounded-full bg-[var(--bg-elevated)] px-6 py-2 text-sm text-[var(--text-secondary)] transition-opacity hover:opacity-80"
          >
            Back
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex gap-3">
        {PRESET_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handlePreset(btn.key)}
            className={`flex flex-col items-center rounded-xl px-4 py-3 text-xs transition-all ${
              selectedPreset === btn.key
                ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
            }`}
          >
            <span className="font-medium text-[var(--text-primary)]">{btn.label}</span>
            <span className="text-[var(--text-muted)]">{btn.sub}</span>
          </button>
        ))}
        <button
          onClick={handleCustom}
          className={`flex flex-col items-center rounded-xl px-4 py-3 text-xs transition-all ${
            showDial ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]' : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
          }`}
        >
          <span className="font-medium text-[var(--text-primary)]">Custom</span>
          <span className="text-[var(--text-muted)]">dial</span>
        </button>
      </div>
    </motion.div>
  )
}
