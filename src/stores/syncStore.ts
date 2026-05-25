import { create } from 'zustand'

export type SyncStatus = 'idle' | 'saving' | 'syncing' | 'saved' | 'offline' | 'reconnecting'

interface SyncStore {
  status: SyncStatus
  lastSynced: number | null
  setStatus: (status: SyncStatus) => void
  setLastSynced: (timestamp: number) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: 'idle',
  lastSynced: null,
  setStatus: (status) => set({ status }),
  setLastSynced: (timestamp) => set({ lastSynced: timestamp }),
}))
