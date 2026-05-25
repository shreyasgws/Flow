import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import { clearAllLocalData } from '@/lib/db'
import type { User, Session, Subscription } from '@supabase/supabase-js'

interface AuthStore {
  session: Session | null
  user: User | null
  isReady: boolean
  init: () => Promise<void>
  signOut: () => Promise<void>
  needsPull: boolean
  clearNeedsPull: () => void
}

let _subscription: Subscription | null = null

const STORED_USER_KEY = 'flow:last_user_id'

function getStoredUserId(): string | null {
  try { return localStorage.getItem(STORED_USER_KEY) } catch { return null }
}

function setStoredUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORED_USER_KEY, id)
    else localStorage.removeItem(STORED_USER_KEY)
  } catch { /* ignore */ }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isReady: false,
  needsPull: false,

  clearNeedsPull: () => set({ needsPull: false }),

  init: async () => {
    if (get().isReady) return
    let sb
    try { sb = getSupabase() } catch { return }
    const { data: { session } } = await sb.auth.getSession()
    const currentUserId = session?.user?.id ?? null

    // If a different user was signed in last time on this domain,
    // clear stale local data before loading anything.
    const storedUserId = getStoredUserId()
    if (currentUserId && storedUserId && currentUserId !== storedUserId) {
      await clearAllLocalData()
    }

    // Trigger a pull on page load if already signed in.
    // This syncs data across domains (e.g. flow-gws → old domain).
    if (currentUserId) {
      setStoredUserId(currentUserId)
      set({ needsPull: true })
    }

    set({ session, user: session?.user ?? null, isReady: true })
    if (_subscription) return
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const prevUser = get().user
      const newUser = session?.user ?? null

      set({ session, user: newUser })

      if (event === 'SIGNED_OUT') {
        clearAllLocalData()
        setStoredUserId(null)
      } else if (event === 'SIGNED_IN' && newUser) {
        setStoredUserId(newUser.id)
        if (prevUser && prevUser.id !== newUser.id) {
          // Switching to a different user — clear stale local data first,
          // then pull fresh data from the server for the new user
          clearAllLocalData().then(() => {
            get().clearNeedsPull()
            set({ needsPull: true })
          })
        } else {
          set({ needsPull: true })
        }
      }
    })
    _subscription = subscription
  },

  signOut: async () => {
    try {
      const { flushQueueOnce } = await import('@/lib/sync')
      await flushQueueOnce()
    } catch { /* proceed even if sync fails */ }
    setStoredUserId(null)
    try { await clearAllLocalData() } catch { /* ignore */ }
    try { await getSupabase().auth.signOut() } catch { /* ignore network errors */ }
    set({ session: null, user: null, needsPull: false })
  },
}))
