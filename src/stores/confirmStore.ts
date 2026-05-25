import { create } from 'zustand'

export interface ConfirmOptions {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  timeout?: number
}

interface ConfirmStore {
  options: ConfirmOptions | null
  show: (options: ConfirmOptions) => void
  hide: () => void
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  options: null,
  show: (options) => set({ options }),
  hide: () => set({ options: null }),
}))
