'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { getSupabase } from '@/lib/supabase'
const supabase = getSupabase()

export default function Landing() {
  const router = useRouter()
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [showContent, setShowContent] = useState(false)
  const [authPending, setAuthPending] = useState(false)

  useEffect(() => {
    if (settings?.anonymousOnboarding === false) {
      router.replace('/home')
      return
    }
    const t = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(t)
  }, [settings?.anonymousOnboarding, router])

  async function handleAnonymous() {
    setAuthPending(true)
    try {
      await supabase.auth.signInAnonymously()
      await updateSettings({ anonymousOnboarding: false })
      router.replace('/home')
    } catch {
      setAuthPending(false)
    }
  }

  async function handleGoogleSignIn() {
    setAuthPending(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback` },
      })
      if (error) throw error
      await updateSettings({ anonymousOnboarding: false })
    } catch {
      setAuthPending(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)]">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'var(--landing-glow)' }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <p
          className="mb-3 tracking-widest text-[var(--text-primary)]"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 48, fontWeight: 300, letterSpacing: '0.15em' }}
        >
          FLOW
        </p>
        <p
          className="mb-10 leading-snug text-[var(--text-secondary)]"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 300 }}
        >
          A calmer way
          <br />
          to move through your day.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={authPending}
          className="mb-4 w-full max-w-[280px] rounded-full bg-[var(--bg-surface)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {authPending ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="mb-6 text-xs text-[var(--text-ghost)]">
          or continue without an account
        </p>

        <button
          onClick={handleAnonymous}
          disabled={authPending}
          className="rounded-full border border-[var(--bg-elevated)] px-6 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--text-ghost)] disabled:opacity-50"
        >
          {authPending ? 'Signing in…' : 'Enter anonymously'}
        </button>

        <p
          className="mt-16 max-w-[240px] text-xs leading-relaxed text-[var(--text-ghost)]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Structure without pressure.
        </p>
      </motion.div>
    </div>
  )
}
