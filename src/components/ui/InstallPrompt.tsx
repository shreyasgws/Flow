'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useSettingsStore } from '@/stores/settingsStore'

export function InstallPrompt() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (settings.installPromptDismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setVisible(true), 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [settings.installPromptDismissed])

  async function handleInstall() {
    if (!deferredPrompt) return
    ;(deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt()
    const result = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice
    if (result.outcome === 'accepted') {
      await updateSettings({ installPromptDismissed: true })
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  async function handleDismiss() {
    await updateSettings({ installPromptDismissed: true })
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-lg"
        >
          <p className="mb-3 text-sm text-[var(--text-primary)]">
            Flow works offline. Install for a calmer experience.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="btn-primary flex-1 px-4 py-1.5"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="btn-secondary flex-1 px-4 py-1.5"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
