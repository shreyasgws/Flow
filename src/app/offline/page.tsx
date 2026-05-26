'use client'

import { useSyncStore } from '@/stores/syncStore'

export default function Offline() {
  const lastSynced = useSyncStore((s) => s.lastSynced)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)] px-8 text-center">
      <h1 className="mb-3 font-serif text-3xl text-[var(--text-primary)]">
        You&rsquo;re offline
      </h1>
      <p className="mb-2 text-sm text-[var(--text-secondary)]">
        Your data is safe. Everything still works.
      </p>
      {lastSynced && (
        <p className="mb-6 text-[10px] text-[var(--text-muted)]">
          Last synced: {new Date(lastSynced).toLocaleTimeString()}
        </p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="btn-primary px-6 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
