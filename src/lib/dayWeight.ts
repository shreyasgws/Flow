export interface DayWeightResult {
  weight: 'light' | 'medium' | 'heavy'
  density: number
  opacity: number
  spacing: number
}

export interface DayWeightInput {
  taskCount: number
  estimatedHours: number
  completionRatio: number
}

export function calculateDayWeight(input: DayWeightInput): DayWeightResult {
  const { taskCount, estimatedHours, completionRatio } = input

  const rawWeight = taskCount * 1.5 + estimatedHours * 2 - completionRatio * 3
  const clamped = Math.max(0, Math.min(rawWeight, 10))

  let weight: DayWeightResult['weight']
  let density: number
  let opacity: number
  let spacing: number

  if (clamped < 3) {
    weight = 'light'
    density = 0.6
    opacity = 0.5
    spacing = 1.6
  } else if (clamped < 7) {
    weight = 'medium'
    density = 0.8
    opacity = 0.75
    spacing = 1.2
  } else {
    weight = 'heavy'
    density = 1
    opacity = 1
    spacing = 0.9
  }

  return { weight, density, opacity, spacing }
}

export function getCompletionLabel(completed: number, total: number): string {
  if (total === 0) return 'Nothing was planned this day. That is fine.'
  const ratio = completed / total
  if (completed === total) return 'Everything done.'
  if (ratio > 0.8) return 'Strong day.'
  if (ratio >= 0.5) return 'Good pace.'
  if (ratio >= 0.2) return 'Quiet day.'
  return 'Rough day.'
}

export function getCompactCompletionLabel(completed: number, total: number): string {
  if (total === 0) return 'empty'
  const ratio = completed / total
  if (completed === total) return 'full'
  if (ratio > 0.8) return 'full'
  if (ratio >= 0.5) return 'light'
  if (ratio >= 0.2) return 'quiet'
  return 'empty'
}
