'use client'

interface EmptyReviewProps {
  hasHistory: boolean
}

export function EmptyReview({ hasHistory }: EmptyReviewProps) {
  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-[var(--text-muted)]">
        Nothing was planned this day. That is fine.
      </p>
      {hasHistory && (
        <p className="mt-1 text-xs text-[var(--text-ghost)]">
          Other days in this week have plans.
        </p>
      )}
    </div>
  )
}
