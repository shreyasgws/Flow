'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAmbientTime } from '@/hooks/useAmbientTime'
import { AmbientLayer } from '@/components/ambient/AmbientLayer'
import { BottomNav } from './BottomNav'
import { DriftButton } from '@/components/ui/DriftButton'
import { UndoSnackbar } from '@/components/ui/UndoSnackbar'
import { ConfirmBar } from '@/components/ui/ConfirmBar'
import { ErrorToast } from '@/components/ui/ErrorToast'
import { AdaptivePerformance } from '@/components/ambient/AdaptivePerformance'
import { SyncStatus } from '@/components/ui/SyncStatus'
import { InstallPrompt } from '@/components/ui/InstallPrompt'
import { useUndo } from '@/hooks/useUndo'
import { onUndo } from '@/lib/undo'
import { markNudgeSeen, getLastSeenTimestamp, scheduleDailyNudge, cancelDailyNudge } from '@/lib/notifications'

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFocus = pathname?.startsWith('/focus/')
  const isLanding = pathname === '/'
  useAmbientTime()
  const env = useEnvironmentStore((s) => s.state)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const { push, undo, dismiss, currentUndo, stack, undoFromStack } = useUndo()
  const pushRef = useRef(push)

  useEffect(() => {
    pushRef.current = push
  }, [push])

  useEffect(() => {
    const unsub = onUndo((entry) => pushRef.current(entry))
    return unsub
  }, [])

  useEffect(() => {
    if (!settings.dailyNudgeEnabled) return

    const lastSeen = getLastSeenTimestamp()
    const lastNudgeTime = settings.lastNudgeDate
      ? new Date(settings.lastNudgeDate).getTime()
      : 0

    if (lastNudgeTime > 0 && lastSeen < lastNudgeTime) {
      const newMissed = settings.consecutiveMissedNudges + 1
      if (newMissed >= 2 && settings.nudgeSuppressionLevel < 3) {
        const newLevel = settings.nudgeSuppressionLevel + 1
        updateSettings({
          consecutiveMissedNudges: newMissed,
          nudgeSuppressionLevel: newLevel,
        })
      } else {
        updateSettings({ consecutiveMissedNudges: newMissed })
      }
    }
  }, [])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        markNudgeSeen()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (!settings.dailyNudgeEnabled) return
    cancelDailyNudge()
    scheduleDailyNudge(
      settings.dayStartHour, 0, 0,
      settings.nudgeSuppressionLevel, settings.lastNudgeDate,
      settings.quietHoursStart, settings.quietHoursEnd,
      settings.storedTimezoneOffset,
    )
  }, [
    settings.dailyNudgeEnabled,
    settings.dayStartHour,
    settings.nudgeSuppressionLevel,
    settings.quietHoursStart,
    settings.quietHoursEnd,
  ])

  return (
    <div
      className="relative min-h-screen"
      style={{
        '--spacing-density': `${0.8 + env.spacingDensity * 0.4}`,
        '--motion-intensity': `${env.motionIntensity}`,
        '--ambient-warmth': `${env.ambientWarmth}`,
        '--visual-noise': `${env.visualNoise}`,
        '--transition-speed': `${env.transitionSpeed}s`,
      } as React.CSSProperties}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--bg-surface)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--accent)] focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)]"
      >
        Skip to content
      </a>
      {!isFocus && !isLanding && <AmbientLayer />}
      <AdaptivePerformance />
      {!isFocus && !isLanding && <ErrorToast />}
      <main id="main-content" className={`relative z-10 mx-auto max-w-lg ${isFocus || isLanding ? '' : 'pb-24 pt-4'}`}>
        {!isFocus && !isLanding && (
          <div className="fixed right-4 top-2 z-30">
            <SyncStatus />
          </div>
        )}
        {children}
      </main>
      {!isFocus && !isLanding && <DriftButton />}
      {!isFocus && !isLanding && <InstallPrompt />}
      {!isFocus && !isLanding && <BottomNav />}
      {!isFocus && !isLanding && (
        <UndoSnackbar
          currentUndo={currentUndo}
          stack={stack}
          onUndo={undo}
          onUndoFromStack={undoFromStack}
          onDismiss={dismiss}
        />
      )}
      {!isFocus && !isLanding && <ConfirmBar />}
    </div>
  )
}
