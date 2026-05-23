type UndoFn = () => void | Promise<void>

interface UndoRegistration {
  id: string
  label: string
  undo: UndoFn
}

type Listener = (entry: UndoRegistration) => void

let listener: Listener | null = null

export function onUndo(fn: Listener) {
  listener = fn
}

export function pushUndo(id: string, label: string, undo: UndoFn) {
  listener?.({ id, label, undo })
}

export function clearListener() {
  listener = null
}
