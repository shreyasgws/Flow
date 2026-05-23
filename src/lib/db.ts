import Dexie, { type EntityTable } from 'dexie'
import type { Task, FlowSection, DriftEntry, Reflection, UndoAction, AppSettings, Category } from '@/types'

export class FlowDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  flowSections!: EntityTable<FlowSection, 'id'>
  driftEntries!: EntityTable<DriftEntry, 'id'>
  reflections!: EntityTable<Reflection, 'id'>
  undoHistory!: EntityTable<UndoAction, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  categories!: EntityTable<Category, 'id'>

  constructor() {
    super('flow')
    this.version(3).stores({
      tasks: 'id, date, flowSectionId, categoryId, status, sortOrder',
      flowSections: 'id, sortOrder',
      driftEntries: 'id, createdAt',
      reflections: 'id, weekStart',
      undoHistory: 'id, timestamp',
      settings: 'id',
      categories: 'id, sortOrder',
    })
  }
}

export const db = new FlowDatabase()

export async function seedDefaultSections(userId: string = 'default'): Promise<string[]> {
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
