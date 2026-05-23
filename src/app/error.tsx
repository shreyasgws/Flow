'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Root error boundary caught:', error)
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-8">
      <div className="max-w-sm text-center">
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--warn)]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <circle cx="8" cy="8" r="7" />
            <path d="M8 5v4M8 11v.01" strokeLinecap="round" />
          </svg>
        </span>
        <h2 className="mb-1 text-base font-medium text-[var(--text-primary)]">
          Something unexpected happened
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          No data was lost. You can try again.
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
