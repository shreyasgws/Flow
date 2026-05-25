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
}

function generateSessionId(): string {
  return `${crypto.randomUUID().slice(0, 8)}-${Date.now()}`
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: 'idle',
  lastSynced: null,
  sessionId: typeof crypto !== 'undefined' ? generateSessionId() : null,
  lastRemoteChange: null,
  setStatus: (status) => set({ status }),
  setLastSynced: (timestamp) => set({ lastSynced: timestamp }),
  setSessionId: (id) => set({ sessionId: id }),
  setLastRemoteChange: (timestamp) => set({ lastRemoteChange: timestamp }),
}))
