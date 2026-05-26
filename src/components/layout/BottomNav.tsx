'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useFocusStore } from '@/stores/focusStore'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 8.5L9 2l7 6.5" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'var(--accent)' : 'none'} opacity={active ? 0.2 : 0} />
      <path d="M4 7v7a1 1 0 001 1h3M14 7v7a1 1 0 01-1 1h-3" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WeekIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} />
      <path d="M2 7h14" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} />
      <path d="M5 1v3M13 1v3" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinecap="round" />
      <circle cx="6" cy="10" r="1" fill={active ? 'var(--accent)' : 'var(--text-muted)'} opacity={active ? 1 : 0.4} />
      <circle cx="10" cy="10" r="1" fill={active ? 'var(--accent)' : 'var(--text-muted)'} opacity={active ? 1 : 0.4} />
      <circle cx="14" cy="10" r="1" fill={active ? 'var(--accent)' : 'var(--text-muted)'} opacity={active ? 1 : 0.4} />
    </svg>
  )
}

function FocusIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} />
      <circle cx="9" cy="9" r="2.5" fill={active ? 'var(--accent)' : 'currentColor'} opacity={active ? 1 : 0.3} />
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} />
      <path d="M9 5.5V9l2.5 1.5" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4" stroke="currentColor" strokeWidth={active ? 1.6 : 1.2} strokeLinecap="round" opacity={0.4} />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/home', label: 'Home', Icon: HomeIcon },
  { href: '/weekly', label: 'Week', Icon: WeekIcon },
  { href: '/focus', label: 'Focus', Icon: FocusIcon },
  { href: '/history', label: 'History', Icon: HistoryIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const activeTaskId = useFocusStore((s) => s.activeTaskId)
  const isFocusActive = activeTaskId !== null

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-base)]/75 backdrop-blur-lg">
      <div role="list" className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          let isActive = pathname === item.href
          if (item.href === '/focus') {
            isActive = pathname.startsWith('/focus/') || (isFocusActive && pathname === '/focus')
          }

          return (
            <motion.div
              key={item.href}
              whileHover={{ scale: isActive ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="listitem"
            >
              <Link
                href={item.href === '/focus' && isFocusActive ? `/focus/${activeTaskId}` : item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  isActive
                    ? 'text-[var(--accent)]'
                    : item.href === '/focus' && isFocusActive
                      ? 'text-[var(--accent)]/50'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                <item.Icon active={isActive} />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
