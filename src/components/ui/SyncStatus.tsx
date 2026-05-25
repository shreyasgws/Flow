'use client'

import { useSync } from '@/hooks/useSync'

const LABELS: Record<string, string> = {
  idle: '',
  saving: 'Saving locally',
  syncing: 'Syncing when ready',
  saved: 'Everything is in sync',
  offline: 'Sync resumes when connection returns',
  reconnecting: 'Reconnecting quietly',
}

const COLORS: Record<string, string> = {
  saving: 'text-[var(--text-muted)]',
  syncing: 'text-[var(--accent)]',
  saved: 'text-[var(--text-muted)]',
  offline: 'text-[var(--warn)]',
  reconnecting: 'text-[var(--accent)]',
}

export function SyncStatus() {
  const { status } = useSync()
  const label = LABELS[status]
  if (!label) return null

  return (
    <span className={`text-[10px] transition-opacity ${COLORS[status] ?? 'text-[var(--text-muted)]'}`}>
      {status === 'offline' && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />}
      {label}
    </span>
  )
}
