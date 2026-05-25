'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { PAGE_TRANSITION } from '@/lib/motionConfig'
import { startTransition, endTransition } from '@/lib/transitionManager'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" onExitComplete={endTransition}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={PAGE_TRANSITION()}
        onAnimationStart={startTransition}
        onAnimationComplete={endTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
