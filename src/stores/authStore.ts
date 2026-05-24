import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
const supabase = getSupabase()
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
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, isReady: true })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },
}))
