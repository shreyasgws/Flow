'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useFocusStore } from '@/stores/focusStore'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '○' },
  { href: '/weekly', label: 'Week', icon: '≡' },
  { href: '/focus', label: 'Focus', icon: '◉' },
  { href: '/history', label: 'History', icon: '⊡' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const activeTaskId = useFocusStore((s) => s.activeTaskId)

  const isFocusActive = activeTaskId !== null

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--bg-elevated)] bg-[var(--bg-base)]/80 backdrop-blur-lg">
      <div role="list" className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {NAV_ITEMS.map((item) => {
          let isActive = pathname === item.href

          if (item.href === '/focus') {
            isActive = pathname.startsWith('/focus/') || (isFocusActive && pathname === '/focus')
          }

          return (
            <motion.div
              key={item.href}
              whileHover={isActive ? {} : { scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              role="listitem"
            >
              <Link
                href={item.href === '/focus' && isFocusActive ? `/focus/${activeTaskId}` : item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  isActive
                    ? 'text-[var(--accent)]'
                    : item.href === '/focus' && isFocusActive
                      ? 'text-[var(--accent)]/60'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                <span
                  className={`text-lg ${item.href === '/focus' && (isActive || isFocusActive) ? 'drop-shadow-[0_0_4px_var(--accent)]' : ''}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {item.href === '/focus' && isFocusActive ? (
                  <span className="max-w-[60px] truncate text-[10px]"
                    >{useFocusStore.getState().activeTaskId?.slice(0, 8)}…</span>
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
