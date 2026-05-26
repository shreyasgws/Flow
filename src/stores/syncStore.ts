import { create } from 'zustand'

export type SyncStatus = 'idle' | 'saving' | 'syncing' | 'saved' | 'offline' | 'reconnecting'

interface SyncStore {
  status: SyncStatus
  lastSynced: number | null
  sessionId: string | null
  lastRemoteChange: number | null
  setStatus: (status: SyncStatus) => void
  setLastSynced: (timestamp: number) => void
  setSessionId: (id: string) => void
  setLastRemoteChange: (timestamp: number) => void
  reset: () => void
}

function generateSessionId(): string {
  return `${crypto.randomUUID().slice(0, 8)}-${Date.now()}`
}

const initialState = {
  status: 'idle' as SyncStatus,
  lastSynced: null as number | null,
  sessionId: null as string | null,
  lastRemoteChange: null as number | null,
}

export const useSyncStore = create<SyncStore>((set) => ({
  ...initialState,
  sessionId: typeof crypto !== 'undefined' ? generateSessionId() : null,

  reset: () => set({ ...initialState, sessionId: generateSessionId() }),

  setStatus: (status) => set({ status }),
  setLastSynced: (timestamp) => set({ lastSynced: timestamp }),
  setSessionId: (id) => set({ sessionId: id }),
  setLastRemoteChange: (timestamp) => set({ lastRemoteChange: timestamp }),
}))
