'use client'

import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEnvironmentStore } from '@/stores/environmentStore'

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const setIntensity = useEnvironmentStore((s) => s.setIntensity)
  const setMode = useEnvironmentStore((s) => s.setMode)
  const synced = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light')
  }, [settings.theme])

  useEffect(() => {
    if (synced.current) return
    synced.current = true
    setMode(settings.environmentMode)
    setIntensity(settings.ambientIntensity)
  }, [settings.environmentMode, settings.ambientIntensity, setMode, setIntensity])

  return (
    <div className="px-4">
      <header className="mb-6 mt-2">
        <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Shape the space
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Theme
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              settings.theme === 'dark'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => updateSettings({ theme: 'light' })}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              settings.theme === 'light'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            Light
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Mode
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { updateSettings({ environmentMode: 'ambient' }); setMode('ambient') }}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              settings.environmentMode === 'ambient'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            Ambient
          </button>
          <button
            onClick={() => { updateSettings({ environmentMode: 'static' }); setMode('static') }}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              settings.environmentMode === 'static'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            Static
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Atmosphere Intensity
        </h2>
        <div className="flex gap-2">
          {(['minimal', 'subtle', 'full'] as const).map((level) => (
            <button
              key={level}
              onClick={() => { updateSettings({ ambientIntensity: level }); setIntensity(level) }}
              className={`rounded-full px-4 py-1.5 text-xs capitalize transition-colors ${
                settings.ambientIntensity === level
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Day Start Hour
        </h2>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={settings.dayStartHour}
          onChange={(e) => updateSettings({ dayStartHour: parseInt(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Day starts at {settings.dayStartHour.toString().padStart(2, '0')}:00
        </p>
      </section>
    </div>
  )
}
