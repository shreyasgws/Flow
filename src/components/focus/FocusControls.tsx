'use client'

import { useFocusStore } from '@/stores/focusStore'

const ARC_RADIUS = 54
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS

export function FocusControls() {
  const timerConfig = useFocusStore((s) => s.timerConfig)
  const secondsRemaining = useFocusStore((s) => s.secondsRemaining)
  const elapsedSeconds = useFocusStore((s) => s.elapsedSeconds)
  const isPaused = useFocusStore((s) => s.isPaused)
  const isBreak = useFocusStore((s) => s.isBreak)
  const pauseTimer = useFocusStore((s) => s.pauseTimer)
  const resumeTimer = useFocusStore((s) => s.resumeTimer)
  const cancelTimer = useFocusStore((s) => s.cancelTimer)

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const countdownFraction = timerConfig && secondsRemaining !== null
    ? secondsRemaining / (timerConfig.workMinutes * 60)
    : 1

  const progressArc = ARC_CIRCUMFERENCE * (1 - (timerConfig ? 1 - countdownFraction : 0))

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60" cy="60" r={ARC_RADIUS}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="3"
          />
          <circle
            cx="60" cy="60" r={ARC_RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray={ARC_CIRCUMFERENCE}
            strokeDashoffset={progressArc}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          {timerConfig && secondsRemaining !== null ? (
            <>
              <span className="font-mono text-5xl tracking-tight text-[var(--text-primary)]">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {isBreak ? 'break' : 'remaining'}
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-5xl tracking-tight text-[var(--text-primary)]">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">elapsed</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {timerConfig && (
          <>
            <button
              onClick={isPaused ? resumeTimer : pauseTimer}
              aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
              className="btn-secondary px-6 py-2 text-sm"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={cancelTimer}
              aria-label="Cancel timer"
              className="btn-secondary px-6 py-2 text-sm text-[var(--text-muted)]"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-[var(--text-ghost)]">
        elapsed: {formatTime(elapsedSeconds)}
      </div>
    </div>
  )
}
