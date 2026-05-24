'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing in…')

  useEffect(() => {
    let cancelled = false
    async function handleCallback() {
      try {
        const supabase = getSupabase()
        const { searchParams } = new URL(window.location.href)
        const code = searchParams.get('code')
        const next = searchParams.get('next') ?? '/home'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        if (!cancelled) router.replace(next)
      } catch {
        if (!cancelled) setStatus('Sign-in failed. Try again.')
      }
    }

    handleCallback()
    return () => { cancelled = true }
  }, [router])

  if (status === 'Sign-in failed. Try again.') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">{status}</p>
          <button
            onClick={() => router.replace('/')}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <p className="text-sm text-[var(--text-secondary)]">{status}</p>
    </div>
  )
}
