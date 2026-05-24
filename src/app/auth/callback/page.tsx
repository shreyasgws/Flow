'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing in…')

  useEffect(() => {
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

        router.replace(next)
      } catch {
        setStatus('Sign-in failed. Try again.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <p className="text-sm text-[var(--text-secondary)]">{status}</p>
    </div>
  )
}
