'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ColorPicker } from './ColorPicker'
import type { EnergyType } from '@/types'

const ENERGY_LABELS: { value: EnergyType; label: string }[] = [
  { value: 'deep_focus', label: 'Deep Focus' },
  { value: 'light_tasks', label: 'Light Tasks' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'creative', label: 'Creative' },
  { value: 'social', label: 'Social' },
  { value: 'reflection', label: 'Reflection' },
]

interface SectionEditorProps {
  open: boolean
  initial: {
    name: string
    startTime: string
    endTime: string
    atmosphereColor: string
    energyType: EnergyType | null
    icon: string | null
  }
  onSave: (data: {
    name: string
    startTime: string
    endTime: string
    atmosphereColor: string
    energyType: EnergyType | null
    icon: string | null
  }) => Promise<void>
  onClose: () => void
  title: string
}

export function SectionEditor({ open, initial, onSave, onClose, title }: SectionEditorProps) {
  const [name, setName] = useState(initial.name)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [endTime, setEndTime] = useState(initial.endTime)
  const [atmosphereColor, setAtmosphereColor] = useState(initial.atmosphereColor)
  const [energyType, setEnergyType] = useState<EnergyType | null>(initial.energyType)
  const [isPending, setIsPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(initial.name)
      setStartTime(initial.startTime)
      setEndTime(initial.endTime)
      setAtmosphereColor(initial.atmosphereColor)
      setEnergyType(initial.energyType)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending || !name.trim()) return
    setIsPending(true)
    try {
      await onSave({
        name: name.trim(),
        startTime,
        endTime,
        atmosphereColor,
        energyType,
        icon: null,
      })
      onClose()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--bg-surface)] p-6 pb-8 shadow-xl"
          >
            <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[var(--text-ghost)]" />
            <h2 className="mb-4 text-sm font-medium text-[var(--text-primary)]">{title}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Section name"
                maxLength={30}
                disabled={isPending}
                className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)] disabled:opacity-50"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none disabled:opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">Color</label>
                <ColorPicker value={atmosphereColor} onChange={setAtmosphereColor} />
              </div>

              <div>
                <label className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">Energy</label>
                <div className="flex flex-wrap gap-1.5">
                  {ENERGY_LABELS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => setEnergyType(energyType === e.value ? null : e.value)}
                      disabled={isPending}
                      className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                        energyType === e.value
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      } disabled:opacity-50`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="btn-primary flex-1 py-2 text-sm"
                >
                  {isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
