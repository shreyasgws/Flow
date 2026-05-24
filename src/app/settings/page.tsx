'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { CategoryManager } from '@/components/category/CategoryManager'
import { TemplateManager } from '@/components/template/TemplateManager'
import { requestPermission, getStoredPermission, isNotificationSupported, cancelDailyNudge, scheduleDailyNudge } from '@/lib/notifications'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useDriftStore } from '@/stores/driftStore'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const setIntensity = useEnvironmentStore((s) => s.setIntensity)
  const setMode = useEnvironmentStore((s) => s.setMode)
  const allTasks = useTaskStore((s) => s.tasks)
  const driftEntries = useDriftStore((s) => s.entries)
  const authUser = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const router = useRouter()
  const [signInPending, setSignInPending] = useState(false)
  const synced = useRef(false)

  const notifSupported = isNotificationSupported()
  const notifPermission = getStoredPermission()

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light')
  }, [settings.theme])

  useEffect(() => {
    if (synced.current) return
    synced.current = true
    setMode(settings.environmentMode)
    setIntensity(settings.ambientIntensity)
  }, [settings.environmentMode, settings.ambientIntensity, setMode, setIntensity])

  async function handleRequestNotification() {
    if (!notifSupported) return
    const perm = await requestPermission()
    if (perm === 'granted') {
      const activeCount = allTasks.filter((t) => t.status === 'active').length
      scheduleDailyNudge(settings.dayStartHour, activeCount, driftEntries.length)
    }
  }

  function handleToggleNudge(val: boolean) {
    updateSettings({ dailyNudgeEnabled: val })
    if (!val) {
      cancelDailyNudge()
    } else if (notifPermission === 'granted') {
      const activeCount = allTasks.filter((t) => t.status === 'active').length
      scheduleDailyNudge(settings.dayStartHour, activeCount, driftEntries.length)
    }
  }

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

      {authUser ? (
        <section className="mb-6 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center gap-3">
            {authUser.user_metadata?.avatar_url ? (
              <img
                src={authUser.user_metadata.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)]">
                {(authUser.email || authUser.id || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-[var(--text-primary)]">
                {authUser.user_metadata?.full_name ?? authUser.email ?? 'Signed in'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {authUser.is_anonymous ? 'Anonymous' : 'Synced to account'}
              </p>
            </div>
            <button
              onClick={async () => { await signOut(); router.replace('/') }}
              className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[10px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Sign out
            </button>
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3">
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Your data only lives on this device. Sign in to keep it safe.
          </p>
          <button
            onClick={async () => {
              setSignInPending(true)
              try {
                const sb = getSupabase()
                await sb.auth.signInAnonymously()
                await updateSettings({ anonymousOnboarding: false })
                router.replace('/home')
              } catch { setSignInPending(false) }
            }}
            disabled={signInPending}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {signInPending ? 'Signing in…' : 'Continue without account'}
          </button>
        </section>
      )}

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

      <section className="mb-6 border-t border-[var(--bg-elevated)] pt-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Notifications
        </h2>

        {!notifSupported && (
          <p className="text-xs text-[var(--text-muted)]">
            Notifications are not supported on this device.
          </p>
        )}

        {notifSupported && notifPermission !== 'granted' && (
          <div className="mb-3 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3">
            <p className="mb-2 text-xs text-[var(--text-secondary)]">
              Flow can send a quiet daily nudge so you never lose track of your day.
            </p>
            <button
              onClick={handleRequestNotification}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
            >
              Enable notifications
            </button>
          </div>
        )}

        {notifSupported && (
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-primary)]">Daily nudge</p>
                <p className="text-[10px] text-[var(--text-ghost)]">
                  A quiet reminder at {((settings.dayStartHour + 2) % 24).toString().padStart(2, '0')}:00
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.dailyNudgeEnabled && notifPermission === 'granted'}
                onClick={() => handleToggleNudge(!settings.dailyNudgeEnabled)}
                disabled={notifPermission !== 'granted'}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.dailyNudgeEnabled && notifPermission === 'granted'
                    ? 'bg-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)]'
                } disabled:opacity-40`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  settings.dailyNudgeEnabled && notifPermission === 'granted'
                    ? 'translate-x-[18px]'
                    : 'translate-x-[3px]'
                }`} />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-primary)]">Focus window alerts</p>
                <p className="text-[10px] text-[var(--text-ghost)]">
                  Remind when a focus window has passed
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.focusWindowAlertsEnabled && notifPermission === 'granted'}
                onClick={() => updateSettings({ focusWindowAlertsEnabled: !settings.focusWindowAlertsEnabled })}
                disabled={notifPermission !== 'granted'}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.focusWindowAlertsEnabled && notifPermission === 'granted'
                    ? 'bg-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)]'
                } disabled:opacity-40`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  settings.focusWindowAlertsEnabled && notifPermission === 'granted'
                    ? 'translate-x-[18px]'
                    : 'translate-x-[3px]'
                }`} />
              </button>
            </label>

            <div className="mt-3 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3">
              <p className="mb-1 text-[10px] text-[var(--text-ghost)]">
                Quiet hours
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--text-muted)]">From</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSettings({ quietHoursStart: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[var(--bg-elevated)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--text-muted)]">To</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[var(--bg-elevated)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 border-t border-[var(--bg-elevated)] pt-6">
        <CategoryManager />
      </section>

      <section className="mb-6 border-t border-[var(--bg-elevated)] pt-6">
        <TemplateManager />
      </section>
    </div>
  )
}
