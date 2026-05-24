export type EnergyType =
  | 'deep_focus'
  | 'light_tasks'
  | 'recovery'
  | 'creative'
  | 'social'
  | 'reflection'

export type AtmosphereColor = string

export type TaskStatus = 'active' | 'completed' | 'archived'

export type FrictionLevel = 'light' | 'medium' | 'heavy'

export interface Category {
  id: string
  name: string
  color: string
  emoji: string | null
  sortOrder: number
  createdAt: number
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  flowSectionId: string | null
  categoryId: string | null
  date: string
  sortOrder: number
  estimatedMinutes: number | null
  frictionLevel: FrictionLevel | null
  focusWindowStart: string | null
  focusWindowEnd: string | null
  createdAt: number
  completedAt: number | null
  isRecurring: boolean
  recurrenceType: 'none' | 'daily' | 'weekdays' | 'weekly'
  recurrenceBaseId: string | null
  sourceDriftId: string | null
}

export interface FlowSection {
  id: string
  name: string
  startTime: string
  endTime: string
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
  weekStart: string
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
  label: string
}

export type AmbientIntensity = 'minimal' | 'subtle' | 'full'
export type EnvironmentMode = 'static' | 'ambient'
export type MotionPreference = 'standard' | 'reduced'

export interface AppSettings {
  id: string
  theme: 'light' | 'dark'
  environmentMode: EnvironmentMode
  ambientIntensity: AmbientIntensity
  motionPreference: MotionPreference
  quietHoursStart: string
  quietHoursEnd: string
  dayStartHour: number
  anonymousOnboarding: boolean
  dailyNudgeEnabled: boolean
  focusWindowAlertsEnabled: boolean
  installPromptDismissed: boolean
  googleLinked: boolean
  carryForwardDismissedFor: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  theme: 'dark',
  environmentMode: 'ambient',
  ambientIntensity: 'subtle',
  motionPreference: 'standard',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dayStartHour: 4,
  anonymousOnboarding: true,
  dailyNudgeEnabled: true,
  focusWindowAlertsEnabled: false,
  installPromptDismissed: false,
  googleLinked: false,
  carryForwardDismissedFor: null,
}

export interface TemplateTask {
  title: string
  flowSectionId: string | null
}

export interface Template {
  id: string
  name: string
  tasks: TemplateTask[]
  sortOrder: number
  createdAt: number
}

export interface FocusSession {
  id: string
  taskId: string
  date: string
  startedAt: number
  endedAt: number | null
  elapsedSeconds: number
  completedTaskOnExit: boolean
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
  hour: number
}
