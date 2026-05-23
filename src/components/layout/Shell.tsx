'use client'

import { useEffect, useRef } from 'react'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { useAmbientTime } from '@/hooks/useAmbientTime'
import { AmbientLayer } from '@/components/ambient/AmbientLayer'
import { BottomNav } from './BottomNav'
import { DriftButton } from '@/components/ui/DriftButton'
import { UndoSnackbar } from '@/components/ui/UndoSnackbar'
import { ErrorToast } from '@/components/ui/ErrorToast'
import { AdaptivePerformance } from '@/components/ambient/AdaptivePerformance'
import { useUndo } from '@/hooks/useUndo'
import { onUndo } from '@/lib/undo'

export function Shell({ children }: { children: React.ReactNode }) {
  useAmbientTime()
  const env = useEnvironmentStore((s) => s.state)
  const { push, undo, dismiss, currentUndo, stack, undoFromStack } = useUndo()
  const pushRef = useRef(push)
  pushRef.current = push

  useEffect(() => {
    const unsub = onUndo((entry) => pushRef.current(entry))
    return unsub
  }, [])

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
      <AmbientLayer />
      <AdaptivePerformance />
      <ErrorToast />
      <main className="relative z-10 mx-auto max-w-lg pb-24 pt-4">
        {children}
      </main>
      <DriftButton />
      <BottomNav />
      <UndoSnackbar
        currentUndo={currentUndo}
        stack={stack}
        onUndo={undo}
        onUndoFromStack={undoFromStack}
        onDismiss={dismiss}
      />
    </div>
  )
}
