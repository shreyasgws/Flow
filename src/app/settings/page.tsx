'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { CategoryManager } from '@/components/category/CategoryManager'
import { TemplateManager } from '@/components/template/TemplateManager'
import { requestPermission, getStoredPermission, isNotificationSupported, cancelDailyNudge, scheduleDailyNudge } from '@/lib/notifications'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useDriftStore } from '@/stores/driftStore'
import { useConfirmStore } from '@/stores/confirmStore'
import { exportToJSON, exportToCSV } from '@/lib/export'
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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
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
    updateSettings({
      dailyNudgeEnabled: val,
      nudgeSuppressionLevel: val ? 0 : settings.nudgeSuppressionLevel,
      consecutiveMissedNudges: val ? 0 : settings.consecutiveMissedNudges,
    })
    if (!val) {
      cancelDailyNudge()
    } else if (notifPermission === 'granted') {
      const activeCount = allTasks.filter((t) => t.status === 'active').length
      scheduleDailyNudge(
        settings.dayStartHour, activeCount, driftEntries.length,
        settings.nudgeSuppressionLevel, settings.lastNudgeDate,
        settings.quietHoursStart, settings.quietHoursEnd,
        settings.storedTimezoneOffset,
      )
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
        <section className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
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
              onClick={() => setShowSignOutConfirm(true)}
              className="btn-secondary"
            >
              Sign out
            </button>
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Your data only lives on this device. Sign in to keep it safe.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={async () => {
                setSignInPending(true)
                try {
                  const sb = getSupabase()
                  const { error } = await sb.auth.signInAnonymously()
                  if (error) throw error
                  await updateSettings({ anonymousOnboarding: false })
                  router.replace('/home')
                } catch { setSignInPending(false) }
              }}
              disabled={signInPending}
              className="btn-secondary"
            >
              {signInPending ? 'Signing in\u2026' : 'Continue without account'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Sign in with Google
            </button>
          </div>
        </section>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSignOutConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowSignOutConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/3 z-50 w-full max-w-sm -translate-x-1/2 rounded-2xl bg-[var(--bg-surface)] p-6 shadow-xl"
              >
                <h2 className="mb-2 text-lg font-medium text-[var(--text-primary)] text-center">
                  Sign out?
                </h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)] leading-relaxed text-center">
                  Your local data stays on this device. Signing out clears your session.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="btn-secondary flex-1 py-3 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowSignOutConfirm(false)
                      await signOut()
                      router.replace('/')
                    }}
                    className="btn-primary flex-1 py-3 text-sm"
                  >
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
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

      <section className="mb-6 border-t border-[var(--border)] pt-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Notifications
        </h2>

        {!notifSupported && (
          <p className="text-xs text-[var(--text-muted)]">
            Notifications are not supported on this device.
          </p>
        )}

        {notifSupported && notifPermission !== 'granted' && (
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <p className="mb-2 text-xs text-[var(--text-secondary)]">
              Flow can send a quiet daily nudge so you never lose track of your day.
            </p>
            <button
              onClick={handleRequestNotification}
              className="btn-primary"
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
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white ${
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
                  settings.focusWindowAlertsEnabled
                    ? 'bg-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)]'
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white ${
                  settings.focusWindowAlertsEnabled
                    ? 'translate-x-[18px]'
                    : 'translate-x-[3px]'
                }`} />
              </button>
            </label>

            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
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
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--text-muted)]">To</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 border-t border-[var(--border)] pt-6">
        <CategoryManager />
      </section>

      <section className="mb-6 border-t border-[var(--border)] pt-6">
        <TemplateManager />
      </section>

      <section className="mb-6 border-t border-[var(--border)] pt-6">
        <h2 className="mb-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Data
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => {
              useConfirmStore.getState().show({
                message: 'Export all data as JSON?',
                confirmLabel: 'Export',
                onConfirm: exportToJSON,
              })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Export to JSON
          </button>
          <button
            onClick={() => {
              useConfirmStore.getState().show({
                message: 'Export tasks as CSV?',
                confirmLabel: 'Export',
                onConfirm: exportToCSV,
              })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Export to CSV
          </button>
          <button
            onClick={() => {
              const count = allTasks.filter((t) => t.status === 'completed').length
              if (count === 0) return
              useConfirmStore.getState().show({
                message: `Clear ${count} completed tasks?`,
                confirmLabel: 'Clear',
                onConfirm: () => useTaskStore.getState().clearCompleted(),
              })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Clear completed tasks
          </button>
          <button
            onClick={() => {
              useConfirmStore.getState().show({
                message: 'Purge all archived drift?',
                confirmLabel: 'Purge',
                onConfirm: () => useDriftStore.getState().purgeArchived(),
              })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Purge archived drift
          </button>
        </div>
      </section>
    </div>
  )
}
