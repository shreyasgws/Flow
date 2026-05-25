import type { Task, FlowSection, DriftEntry } from '@/types'

export interface IntelligenceResult {
  line1: string
  line2: string
  kind: 'normal' | 'heavy' | 'light' | 'recovery' | 'persistent'
  insight?: string
}

const HEAVY_TASK_THRESHOLD = 8
const HEAVY_MINUTES_THRESHOLD = 360

export function analyzeDay(
  tasks: Task[],
  date: string,
  recentHistory: { date: string; completedCount: number; totalCount: number }[],
  sections?: FlowSection[],
  allDrift?: DriftEntry[],
): IntelligenceResult {
  const active = tasks.filter((t) => t.status === 'active')
  const completed = tasks.filter((t) => t.status === 'completed')
  const total = tasks.length
  const totalCompleted = completed.length
  const totalMinutes = active.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const isToday = date === new Date().toISOString().slice(0, 10)
  const hour = new Date().getHours()
  const isMorning = hour >= 4 && hour < 12
  const isAfternoon = hour >= 12 && hour < 17
  const isEvening = hour >= 17 && hour < 22
  const isNight = hour >= 22 || hour < 4

  const yesterday = recentHistory[0]
  const yesterdayWasHeavy = yesterday && yesterday.totalCount >= HEAVY_TASK_THRESHOLD

  const frequentlyUnfinished = findFrequentlyUnfinished(tasks, recentHistory)
  const insight = generateAdditionalInsight(tasks, sections ?? [], allDrift ?? [], recentHistory)

  if (active.length > HEAVY_TASK_THRESHOLD || totalMinutes > HEAVY_MINUTES_THRESHOLD) {
    const tip = frequentlyUnfinished.length > 0
      ? `${frequentlyUnfinished[0].title} often carries over.`
      : 'Start with one thing.'
    return { line1: `${active.length} tasks today. That is a lot.`, line2: tip, kind: 'heavy', insight }
  }

  if (active.length === 0 && totalCompleted > 0) {
    return { line1: 'All done.', line2: `${totalCompleted} tasks completed.`, kind: 'normal', insight }
  }

  if (total === 0 && isToday) {
    if (yesterdayWasHeavy) {
      return { line1: 'Yesterday was full.', line2: 'Today can be lighter.', kind: 'recovery' }
    }
    return { line1: 'Nothing planned yet.', line2: 'Keep today simple.', kind: 'light' }
  }

  if (total === 0 && !isToday) {
    return { line1: 'Nothing was planned this day.', line2: 'That is fine.', kind: 'light' }
  }

  if (yesterdayWasHeavy && active.length <= 3) {
    return { line1: 'A lighter day after a heavy one.', line2: 'That is natural.', kind: 'recovery', insight }
  }

  if (isMorning) {
    if (totalCompleted > 0) {
      return { line1: 'Good morning.', line2: `You already completed ${totalCompleted} thing${totalCompleted > 1 ? 's' : ''}.`, kind: 'normal', insight }
    }
    return { line1: 'Good morning.', line2: `${active.length} task${active.length > 1 ? 's' : ''} ahead.`, kind: 'normal', insight }
  }

  if (isAfternoon) {
    if (totalMinutes >= 180) {
      return { line1: 'Heavy afternoon ahead.', line2: 'Start with something light.', kind: 'heavy', insight }
    }
    return { line1: 'Afternoon momentum.', line2: `${active.length} task${active.length > 1 ? 's' : ''} remaining.`, kind: 'normal', insight }
  }

  if (isEvening) {
    return { line1: 'Good evening.', line2: `${active.length} thing${active.length > 1 ? 's' : ''} left.`, kind: 'normal', insight }
  }

  if (isNight) {
    return { line1: 'Still going.', line2: `${active.length} left. Rest when you need to.`, kind: 'normal', insight }
  }

  return { line1: 'Your day in flow.', line2: `${active.length} active, ${totalCompleted} done.`, kind: 'normal', insight }
}

function findFrequentlyUnfinished(
  tasks: Task[],
  history: { date: string; completedCount: number; totalCount: number }[],
): Task[] {
  const unfinished = tasks.filter((t) => t.status === 'active')
  if (unfinished.length === 0) return []

  const carryoverCandidates = unfinished.filter((t) => {
    const appearedBefore = history.some((h) => h.totalCount > 0)
    return appearedBefore
  })

  return carryoverCandidates.slice(0, 1)
}

export function getRecentHistory(tasks: Task[]): { date: string; completedCount: number; totalCount: number }[] {
  const history: { date: string; completedCount: number; totalCount: number }[] = []
  const today = new Date()
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayTasks = tasks.filter((t) => t.date === dateStr)
    history.push({
      date: dateStr,
      completedCount: dayTasks.filter((t) => t.status === 'completed').length,
      totalCount: dayTasks.length,
    })
  }
  return history
}

function generateAdditionalInsight(
  tasks: Task[],
  sections: FlowSection[],
  drift: DriftEntry[],
  history: { date: string; completedCount: number; totalCount: number }[],
): string | undefined {
  const patterns: string[] = []

  const repeatedSection = findRepeatedSection(sections)
  if (repeatedSection) patterns.push(repeatedSection)

  const carryPattern = findCarryForwardPattern(tasks, history)
  if (carryPattern) patterns.push(carryPattern)

  const revisitedDrift = findRevisitedDrift(tasks, drift)
  if (revisitedDrift) patterns.push(revisitedDrift)

  const rhythm = findRhythmConsistency(history)
  if (rhythm) patterns.push(rhythm)

  return patterns.length > 0 ? patterns[0] : undefined
}

function findRepeatedSection(sections: FlowSection[]): string | undefined {
  if (sections.length === 0) return undefined

  const energyCounts: Record<string, number> = {}
  for (const s of sections) {
    if (s.energyType) {
      energyCounts[s.energyType] = (energyCounts[s.energyType] ?? 0) + 1
    }
  }

  const sorted = Object.entries(energyCounts).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  if (top && top[1] >= 2) {
    const label = top[0].replace('_', ' ')
    return `You often use "${label}" sections.`
  }

  return undefined
}

function findCarryForwardPattern(
  tasks: Task[],
  history: { date: string; completedCount: number; totalCount: number }[],
): string | undefined {
  const carryover = findFrequentlyUnfinished(tasks, history)
  if (carryover.length > 0) {
    const task = carryover[0]
    const totalDays = history.filter((h) => h.totalCount > 0).length
    if (totalDays >= 2) {
      return `"${task.title}" keeps coming back.`
    }
  }
  return undefined
}

function findRevisitedDrift(tasks: Task[], drift: DriftEntry[]): string | undefined {
  const convertedCount = tasks.filter((t) => t.sourceDriftId).length
  if (convertedCount >= 3) {
    return `${convertedCount} drift thoughts turned into tasks.`
  }
  return undefined
}

function findRhythmConsistency(history: { date: string; completedCount: number; totalCount: number }[]): string | undefined {
  const nonEmpty = history.filter((h) => h.totalCount > 0)
  if (nonEmpty.length < 3) return undefined

  const completionRates = nonEmpty.map((h) => (h.totalCount > 0 ? h.completedCount / h.totalCount : 0))
  const avgRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length

  const variance = completionRates.reduce((sum, r) => sum + (r - avgRate) ** 2, 0) / completionRates.length

  if (variance < 0.05 && avgRate >= 0.5) {
    return 'Your completion rhythm is steady.'
  }
  if (variance > 0.2) {
    return 'Some days flow differently than others.'
  }

  return undefined
}
