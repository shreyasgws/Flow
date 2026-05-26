import { getDb } from '@/lib/db'
import { useAuthStore } from '@/stores/authStore'

function currentDb() {
  const state = useAuthStore.getState()
  return getDb(state.user?.id, state.user?.is_anonymous === true)
}

type UndoFn = () => void | Promise<void>

interface UndoRegistration {
  id: string
  label: string
  undo: UndoFn
}

type Listener = (entry: UndoRegistration) => void

const listeners: Set<Listener> = new Set()

export function onUndo(fn: Listener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export async function pushUndo(id: string, label: string, undo: UndoFn) {
  listeners.forEach((fn) => fn({ id, label, undo }))

  try {
    const _db = currentDb()
    await _db.undoHistory.add({
      id,
      type: 'user_action',
      entityType: 'unknown',
      entityId: id,
      previousState: null,
      timestamp: Date.now(),
      label,
    })
  } catch (e) {
    console.error('Failed to persist undo:', e)
  }
}

export async function removeUndoFromDb(id: string) {
  try {
    const _db = currentDb()
    await _db.undoHistory.delete(id)
  } catch (e) {
    console.error('Failed to remove undo:', e)
  }
}

export function clearListener() {
  listeners.clear()
}
