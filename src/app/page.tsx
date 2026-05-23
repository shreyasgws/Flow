'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export default function Landing() {
  const router = useRouter()
  const settings = useSettingsStore((s) => s.settings)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (settings?.anonymousOnboarding === false) {
      router.replace('/home')
      return
    }
    const t = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(t)
  }, [settings?.anonymousOnboarding, router])

  function handleEnter() {
    router.replace('/home')
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)]">
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(183,168,138,0.08) 0%, transparent 60%)',
        }}
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
          onClick={handleEnter}
          className="mb-4 w-full max-w-[280px] rounded-full bg-white px-6 py-3 text-sm font-medium text-[#1a1a1e] transition-opacity hover:opacity-90"
        >
          Continue with Google
        </button>

        <p className="mb-6 text-xs text-[var(--text-ghost)]">
          or continue without an account
        </p>

        <button
          onClick={handleEnter}
          className="rounded-full border border-[var(--bg-elevated)] px-6 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--text-ghost)]"
        >
          Enter anonymously
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
