'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

interface SignInBannerProps {
  onLinked: () => void
}

export function SignInBanner({ onLinked }: SignInBannerProps) {
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabase> | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let isSupabaseReady = false;
    try {
      const supabaseInstance = getSupabase();
      setSupabase(supabaseInstance);
      isSupabaseReady = true;
    } catch { /* not ready */ }

    // Cleanup function
    return () => {
      isSupabaseReady = false;
    };
  }, [])

  async function handleSignIn() {
    if (!supabase) return
    setError(null)
    setIsPending(true)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) throw error
      onLinked()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        Your data only lives on this device. Sign in to keep it safe.
      </p>
      {error && <p className="mb-2 text-[10px] text-red-400">{error}</p>}
      <button
        onClick={handleSignIn}
        disabled={isPending}
        className="btn-primary px-4 py-2"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </div>
  )
}
