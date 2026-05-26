import Dexie, { type EntityTable } from 'dexie'
import type { Task, FlowSection, DriftEntry, Reflection, UndoAction, AppSettings, Category, Template } from '@/types'

export interface SyncQueueItem {
  id?: number
  action: 'upsert' | 'delete'
  table: string
  recordId: string
  payload: unknown
  timestamp: number
  retries: number
  status: 'pending' | 'synced' | 'failed'
}

export class FlowDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  flowSections!: EntityTable<FlowSection, 'id'>
  driftEntries!: EntityTable<DriftEntry, 'id'>
  reflections!: EntityTable<Reflection, 'id'>
  undoHistory!: EntityTable<UndoAction, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  categories!: EntityTable<Category, 'id'>
  templates!: EntityTable<Template, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor(namespace: string) {
    super(namespace)
    this.version(5).stores({
      tasks: 'id, date, flowSectionId, categoryId, status, sortOrder',
      flowSections: 'id, sortOrder',
      driftEntries: 'id, createdAt',
      reflections: 'id, weekStart',
      undoHistory: 'id, timestamp',
      settings: 'id',
      categories: 'id, sortOrder',
      templates: 'id, sortOrder',
      syncQueue: '++id, status, timestamp',
    })
  }
}

const instances = new Map<string, FlowDatabase>()

export function getDbNamespace(userId?: string | null, isAnonymous?: boolean): string {
  if (!userId || isAnonymous) return 'flow_anonymous'
  return `flow_user_${userId}`
}

function ensureDb(ns: string): FlowDatabase {
  let db = instances.get(ns)
  if (!db) {
    db = new FlowDatabase(ns)
    instances.set(ns, db)
  }
  return db
}

export function getDb(userId?: string | null, isAnonymous?: boolean): FlowDatabase {
  const ns = getDbNamespace(userId, isAnonymous)
  return ensureDb(ns)
}

export async function destroyDb(namespace: string): Promise<void> {
  const db = instances.get(namespace)
  if (db) {
    db.close()
    instances.delete(namespace)
  }
  await Dexie.delete(namespace)
}

export async function destroyCurrentDb(userId?: string | null, isAnonymous?: boolean): Promise<void> {
  const ns = getDbNamespace(userId, isAnonymous)
  await destroyDb(ns)
  const uiNs = !userId || isAnonymous ? 'flow_ui_anonymous' : `flow_ui_${userId}`
  try { await Dexie.delete(uiNs) } catch { /* ignore */ }
  try { sessionStorage.clear() } catch { /* ignore */ }
}

export async function seedDefaultSections(userId?: string | null, isAnonymous?: boolean): Promise<string[]> {
  const db = getDb(userId, isAnonymous)
  const count = await db.flowSections.count()
  if (count > 0) return []

  const defaults: FlowSection[] = [
    {
      id: crypto.randomUUID(),
      name: 'Morning',
      startTime: '06:00',
      endTime: '12:00',
      atmosphereColor: '#B8A88A',
      icon: 'coffee',
      energyType: 'light_tasks',
      sortOrder: 0,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Afternoon',
      startTime: '12:00',
      endTime: '17:00',
      atmosphereColor: '#8AB8A8',
      icon: 'sun',
      energyType: 'deep_focus',
      sortOrder: 1,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Evening',
      startTime: '17:00',
      endTime: '21:00',
      atmosphereColor: '#888AB8',
      icon: 'moon',
      energyType: 'light_tasks',
      sortOrder: 2,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Night',
      startTime: '21:00',
      endTime: '06:00',
      atmosphereColor: '#6A6A8A',
      icon: 'spark',
      energyType: 'reflection',
      sortOrder: 3,
      createdAt: Date.now(),
    },
  ]

  await db.flowSections.bulkAdd(defaults)
  return defaults.map((s) => s.id)
}
