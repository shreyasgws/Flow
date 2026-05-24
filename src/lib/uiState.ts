import Dexie, { type EntityTable } from 'dexie'

export interface UiStateEntry {
  id: string
  value: unknown
  updatedAt: number
}

const uiDb = new Dexie('flow_ui') as Dexie & {
  state: EntityTable<UiStateEntry, 'id'>
}
uiDb.version(1).stores({
  state: 'id, updatedAt',
})

const pendingWrites = new Map<string, { value: unknown; timer: ReturnType<typeof setTimeout> }>()

export async function persistUiState(key: string, value: unknown): Promise<void> {
  const existing = pendingWrites.get(key)
  if (existing) clearTimeout(existing.timer)

  const timer = setTimeout(async () => {
    pendingWrites.delete(key)
    try {
      await uiDb.state.put({ id: key, value, updatedAt: Date.now() })
    } catch {
      /* silent */
    }
  }, 5000)

  pendingWrites.set(key, { value, timer })
}

export async function getUiState<T>(key: string): Promise<T | undefined> {
  try {
    const entry = await uiDb.state.get(key)
    return entry?.value as T | undefined
  } catch {
    return undefined
  }
}

export function setSessionState(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(`flow:${key}`, JSON.stringify(value))
  } catch {
    /* silent */
  }
}

export function getSessionState<T>(key: string): T | undefined {
  try {
    const raw = sessionStorage.getItem(`flow:${key}`)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export function clearSessionState(key: string): void {
  try {
    sessionStorage.removeItem(`flow:${key}`)
  } catch {
    /* silent */
  }
}
