export type EnergyType =
  | 'deep_focus'
  | 'light_tasks'
  | 'recovery'
  | 'creative'
  | 'social'
  | 'reflection'

export type AtmosphereColor = string

export type TaskStatus = 'active' | 'completed' | 'archived'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  flowSectionId: string | null
  date: string // YYYY-MM-DD
  sortOrder: number
  estimatedMinutes: number | null
  createdAt: number
  completedAt: number | null
  isRecurring: boolean
  sourceDriftId: string | null
}

export interface FlowSection {
  id: string
  name: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  atmosphereColor: AtmosphereColor
  icon: string | null
  energyType: EnergyType | null
  sortOrder: number
  createdAt: number
}

export interface DriftEntry {
  id: string
  text: string
  createdAt: number
  updatedAt: number
  isArchived: boolean
  source: 'manual' | 'share' | 'widget' | 'voice'
}

export interface Reflection {
  id: string
  weekStart: string // YYYY-MM-DD
  content: string
  categories: string[]
  createdAt: number
}

export interface UndoAction {
  id: string
  type: string
  entityType: string
  entityId: string
  previousState: unknown
  timestamp: number
}

export type AmbientIntensity = 'minimal' | 'subtle' | 'full'
export type EnvironmentMode = 'static' | 'ambient'
export type MotionPreference = 'standard' | 'reduced'

export interface AppSettings {
  theme: 'light' | 'dark'
  environmentMode: EnvironmentMode
  ambientIntensity: AmbientIntensity
  motionPreference: MotionPreference
  quietHoursStart: string // HH:mm
  quietHoursEnd: string // HH:mm
  dayStartHour: number // 0-23
  anonymousOnboarding: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  environmentMode: 'ambient',
  ambientIntensity: 'subtle',
  motionPreference: 'standard',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dayStartHour: 4,
  anonymousOnboarding: true,
}

export interface EnvironmentState {
  mode: EnvironmentMode
  intensity: AmbientIntensity
  contrastLevel: number
  motionIntensity: number
  spacingDensity: number
  ambientWarmth: number
  transitionSpeed: number
  visualNoise: number
}
