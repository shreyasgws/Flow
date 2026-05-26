import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import { destroyCurrentDb } from '@/lib/db'
import type { User, Session, Subscription, RealtimeChannel } from '@supabase/supabase-js'

const STORED_USER_KEY = 'flow:last_user_id'
const STORED_DOMAIN_KEY = 'flow:last_domain'

let _subscription: Subscription | null = null
let _realtimeChannels: RealtimeChannel[] = []
let _initLock = false
let _signingOut = false

function getStoredUserId(): string | null {
  try { return localStorage.getItem(STORED_USER_KEY) } catch { return null }
}

function setStoredUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORED_USER_KEY, id)
    else localStorage.removeItem(STORED_USER_KEY)
  } catch { /* ignore */ }
}

function getStoredDomain(): string | null {
  try { return localStorage.getItem(STORED_DOMAIN_KEY) } catch { return null }
}

function setStoredDomain(domain: string | null) {
  try {
    if (domain) localStorage.setItem(STORED_DOMAIN_KEY, domain)
    else localStorage.removeItem(STORED_DOMAIN_KEY)
  } catch { /* ignore */ }
}

function getCurrentOrigin(): string {
  try { return window.location.origin } catch { return '' }
}

export function attachRealtimeChannel(channel: RealtimeChannel): void {
  _realtimeChannels.push(channel)
}

export function getRealtimeChannels(): RealtimeChannel[] {
  return _realtimeChannels
}

interface AuthStoreActions {
  resetAllStores: () => void
}

let _resetAllStores: (() => void) | null = null

export function registerResetAllStores(fn: () => void): void {
  _resetAllStores = fn
}

function triggerResetStores(): void {
  _resetAllStores?.()
}

export function setupAuthListener(): void {
  if (_subscription) return
  const sb = getSupabase()
  const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
    const { useAuthStore: store } = await import('./authStore')
    const prevUser = store.getState().user
    const newUser = session?.user ?? null

    if (event === 'SIGNED_OUT') {
      const prevId = prevUser?.id ?? null
      const prevIsAnonymous = prevUser?.is_anonymous === true
      store.getState().handleSignOut(prevId, prevIsAnonymous)
    } else if (event === 'SIGNED_IN' && newUser) {
      store.getState().handleSignIn(newUser, prevUser?.id ?? null)
    } else if (event === 'TOKEN_REFRESHED' && newUser) {
      setStoredUserId(newUser.id)
      setStoredDomain(getCurrentOrigin())
      store.setState({ session, user: newUser })
    } else if (event === 'USER_UPDATED' && newUser) {
      store.setState({ session, user: newUser })
    }
  })
  _subscription = subscription
}

export async function detachAuthListener(): Promise<void> {
  if (_subscription) {
    _subscription.unsubscribe()
    _subscription = null
  }
}

export async function clearAuthState(): Promise<void> {
  _realtimeChannels.forEach((ch) => {
    try { ch.unsubscribe() } catch { /* ignore */ }
  })
  _realtimeChannels = []
  setStoredUserId(null)
  setStoredDomain(null)
}

interface AuthStore {
  session: Session | null
  user: User | null
  isReady: boolean
  init: () => Promise<void>
  signOut: () => Promise<void>
  handleSignIn: (user: User, prevUserId: string | null) => Promise<void>
  handleSignOut: (prevUserId: string | null, prevIsAnonymous: boolean) => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isReady: false,

  init: async () => {
    if (get().isReady || _initLock) return
    _initLock = true
    let sb
    try { sb = getSupabase() } catch { _initLock = false; return }
    const { data: { session } } = await sb.auth.getSession()
    const currentUser = session?.user ?? null
    const currentUserId = currentUser?.id ?? null

    // Detect domain change — clear everything if domain differs
    const storedDomain = getStoredDomain()
    const currentDomain = getCurrentOrigin()
    if (storedDomain && storedDomain !== currentDomain) {
      await destroyCurrentDb(currentUserId, currentUser?.is_anonymous === true)
      setStoredUserId(null)
      setStoredDomain(currentDomain)
    }

    // Detect user switch on same domain
    const storedUserId = getStoredUserId()
    if (currentUserId && storedUserId && currentUserId !== storedUserId) {
      await destroyCurrentDb(storedUserId, false)
    }

    setupAuthListener()

    if (currentUserId) {
      setStoredUserId(currentUserId)
      setStoredDomain(currentDomain)
    }

    set({ session, user: currentUser, isReady: true })
    _initLock = false
  },

  handleSignIn: async (newUser: User, prevUserId: string | null) => {
    setStoredUserId(newUser.id)
    setStoredDomain(getCurrentOrigin())

    const newIsAnonymous = newUser.is_anonymous === true
    const prevWasAnonymous = prevUserId !== null && (get().user?.is_anonymous === true)

    if (prevUserId && prevUserId !== newUser.id) {
      // Different user signed in — destroy previous user's DB, pull fresh
      await destroyCurrentDb(prevUserId, prevWasAnonymous)
      triggerResetStores()
      set({ user: newUser, session: await getSupabase().auth.getSession().then(r => r.data.session) })
    } else {
      // Same user or fresh sign-in — update session and let AppProvider handle data loading
      set({ user: newUser, session: await getSupabase().auth.getSession().then(r => r.data.session) })
    }
  },

  handleSignOut: async (prevUserId: string | null, prevIsAnonymous: boolean) => {
    if (_signingOut) return
    _signingOut = true
    try {
      const sb = getSupabase()

      // Flush pending writes before signout
      try {
        const { flushQueueOnce } = await import('@/lib/sync')
        await flushQueueOnce()
      } catch { /* best-effort */ }

      triggerResetStores()

      await sb.auth.signOut()

      set({
        session: null,
        user: null,
      })

      // Keep Dexie data as local cache — don't destroy on signout
      // This ensures tasks survive logout/login cycles
      // Dexie is only destroyed on explicit user switch
    } finally {
      _signingOut = false
    }
  },

  signOut: async () => {
    const { user } = get()
    if (!user) return
    await get().handleSignOut(user.id, user.is_anonymous === true)
  },
}))
