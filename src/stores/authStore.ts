import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  session: Session | null
  user: User | null
  isReady: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isReady: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  signOut: async () => {
    try { await getSupabase().auth.signOut() } catch { /* ignore network errors */ }
    set({ session: null, user: null })
  },

  init: async () => {
    const sb = getSupabase()
    const { data: { session } } = await sb.auth.getSession()
    set({ session, user: session?.user ?? null, isReady: true })

    sb.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },
}))
