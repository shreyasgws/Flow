'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '○' },
  { href: '/weekly', label: 'Week', icon: '≡' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--bg-elevated)] bg-[var(--bg-base)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.href}
              whileHover={isActive ? {} : { scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="contents"
            >
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                  isActive
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
