import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { User, Session, Subscription } from '@supabase/supabase-js'

interface AuthStore {
  session: Session | null
  user: User | null
  isReady: boolean
  init: () => Promise<void>
  signOut: () => Promise<void>
}

let _subscription: Subscription | null = null

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isReady: false,

  init: async () => {
    if (get().isReady) return
    let sb
    try { sb = getSupabase() } catch { return }
    const { data: { session } } = await sb.auth.getSession()
    set({ session, user: session?.user ?? null, isReady: true })
    if (_subscription) return
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
    _subscription = subscription
  },

  signOut: async () => {
    try { await getSupabase().auth.signOut() } catch { /* ignore network errors */ }
    set({ session: null, user: null })
  },
}))
