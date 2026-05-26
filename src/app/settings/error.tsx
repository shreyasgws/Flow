'use client'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-8">
      <div className="max-w-sm text-center">
        <h2 className="mb-1 text-base font-medium text-[var(--text-primary)]">
          Settings couldn&apos;t load
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Your preferences are saved locally. Try again.
        </p>
        <p className="mb-4 text-xs text-red-400">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="btn-primary px-4 py-2"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
