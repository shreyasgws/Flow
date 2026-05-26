import Dexie, { type EntityTable } from 'dexie'
import { useAuthStore } from '@/stores/authStore'

export interface UiStateEntry {
  id: string
  value: unknown
  updatedAt: number
}

function getUiDbName(): string {
  const state = useAuthStore.getState()
  const ns = state.user?.id && !state.user?.is_anonymous
    ? `flow_ui_${state.user.id}`
    : 'flow_ui_anonymous'
  return ns
}

function getUiDb(): Dexie & { state: EntityTable<UiStateEntry, 'id'> } {
  const name = getUiDbName()
  let db = Dexie.getDatabaseNames().then(names => names.includes(name)).catch(() => false)
  const uiDb = new Dexie(name) as Dexie & {
    state: EntityTable<UiStateEntry, 'id'>
  }
  uiDb.version(1).stores({
    state: 'id, updatedAt',
  })
  return uiDb
}

const uiDbs = new Map<string, Dexie & { state: EntityTable<UiStateEntry, 'id'> }>()

function getOrCreateUiDb(): Dexie & { state: EntityTable<UiStateEntry, 'id'> } {
  const name = getUiDbName()
  let db = uiDbs.get(name)
  if (!db) {
    db = new Dexie(name) as Dexie & { state: EntityTable<UiStateEntry, 'id'> }
    db.version(1).stores({
      state: 'id, updatedAt',
    })
    uiDbs.set(name, db)
  }
  return db
}

const pendingWrites = new Map<string, { value: unknown; timer: ReturnType<typeof setTimeout> }>()

export async function persistUiState(key: string, value: unknown): Promise<void> {
  const existing = pendingWrites.get(key)
  if (existing) clearTimeout(existing.timer)

  const timer = setTimeout(async () => {
    pendingWrites.delete(key)
    try {
      const db = getOrCreateUiDb()
      await db.state.put({ id: key, value, updatedAt: Date.now() })
    } catch {
      /* silent */
    }
  }, 5000)

  pendingWrites.set(key, { value, timer })
}

export async function getUiState<T>(key: string): Promise<T | undefined> {
  try {
    const db = getOrCreateUiDb()
    const entry = await db.state.get(key)
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
