'use client'

export default function WeeklyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Weekly error boundary caught:', error)
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-8">
      <div className="max-w-sm text-center">
        <h2 className="mb-1 text-base font-medium text-[var(--text-primary)]">
          Couldn&apos;t load this view
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Your data is safe. Try again.
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
