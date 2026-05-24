'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SignInBannerProps {
  onLinked: () => void
}

export function SignInBanner({ onLinked }: SignInBannerProps) {
  const [isPending, setIsPending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')

  if (status === 'done') return null

  async function handleSignIn() {
    setIsPending(true)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) throw error
      setStatus('done')
      onLinked()
    } catch {
      setStatus('error')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[var(--bg-elevated)] bg-[var(--bg-surface)] p-3">
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        Your data only lives on this device. Sign in to keep it safe.
      </p>
      <button
        onClick={handleSignIn}
        disabled={isPending}
        className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </div>
  )
}
