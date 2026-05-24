'use client'

interface EmptyWeekProps {
  hasHistory: boolean
}

export function EmptyWeek({ hasHistory }: EmptyWeekProps) {
  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-[var(--text-secondary)]">
        {hasHistory
          ? 'Some days in this week have no plans. That is fine.'
          : 'No plans this week. A lighter week can still move gently.'}
      </p>
    </div>
  )
}
