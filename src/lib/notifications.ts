const DAILY_NUDGE_ID = 'daily-nudge'
const PERMISSION_KEY = 'notification-permission'
const NUDGE_RESPONSE_KEY = 'flow:nudge_response'

export type NotificationPermission = 'granted' | 'denied' | 'default'

export function getStoredPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'default'
  const stored = localStorage.getItem(PERMISSION_KEY)
  if (stored === 'granted' || stored === 'denied') return stored
  return 'default'
}

export function setStoredPermission(p: NotificationPermission) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PERMISSION_KEY, p)
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  const result = await Notification.requestPermission()
  setStoredPermission(result)
  return result
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

/* ─── Quiet hours ─── */

export function isInQuietHours(quietHoursStart: string, quietHoursEnd: string): boolean {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const startParts = quietHoursStart.split(':').map(Number)
  const endParts = quietHoursEnd.split(':').map(Number)
  const startMins = startParts[0] * 60 + startParts[1]
  const endMins = endParts[0] * 60 + endParts[1]
  if (startMins <= endMins) {
    return mins >= startMins && mins < endMins
  }
  return mins >= startMins || mins < endMins
}

/* ─── Adaptive frequency ─── */

const NUDGE_INTERVALS: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 0,
}

export function getNudgeIntervalDays(suppressionLevel: number): number {
  return NUDGE_INTERVALS[suppressionLevel] ?? 0
}

export function shouldNudgeToday(
  suppressionLevel: number,
  lastNudgeDate: string | null,
  dayStartHour: number,
): boolean {
  const interval = getNudgeIntervalDays(suppressionLevel)
  if (interval === 0) return false
  if (!lastNudgeDate) return true
  const dayStart = new Date()
  if (dayStart.getHours() < dayStartHour) {
    dayStart.setDate(dayStart.getDate() - 1)
  }
  dayStart.setHours(dayStartHour, 0, 0, 0)
  const last = new Date(lastNudgeDate)
  const daysSince = Math.floor((dayStart.getTime() - last.getTime()) / (24 * 60 * 60 * 1000))
  return daysSince >= interval
}

export function computeNextSuppressionLevel(currentLevel: number): number {
  return Math.min(currentLevel + 1, 3)
}

export function resetSuppressionLevel(): number {
  return 0
}

/* ─── Nudge content ─── */

export interface NudgeContent {
  title: string
  body: string
}

export function getNudgeContent(taskCount: number, driftCount: number): NudgeContent {
  const total = taskCount + driftCount
  if (total === 0) {
    return {
      title: 'Flow',
      body: 'Nothing planned yet. Keep today simple.',
    }
  }
  if (taskCount > 0 && driftCount > 0) {
    return {
      title: 'Flow',
      body: `You have a few things waiting today.`,
    }
  }
  if (taskCount > 0) {
    return {
      title: 'Flow',
      body: `${taskCount} thing${taskCount > 1 ? 's' : ''} waiting today.`,
    }
  }
  return {
    title: 'Flow',
    body: `You have ${driftCount} thought${driftCount > 1 ? 's' : ''} in drift.`,
  }
}

/* ─── Timezone adaptation ─── */

export function detectTimezoneShift(storedOffset: number): number {
  const currentOffset = new Date().getTimezoneOffset()
  if (storedOffset === 0) return 0
  const diff = Math.abs(currentOffset - storedOffset)
  if (diff === 0) return 0
  if (diff < 120) return 1
  return 2
}

export function getAdaptedNudgeHour(
  dayStartHour: number,
  timezoneShift: number,
): number {
  const base = dayStartHour + 2
  if (timezoneShift === 1) {
    const now = new Date()
    const currentMins = now.getHours() * 60 + now.getMinutes()
    const targetMins = base * 60
    const diff = Math.abs(currentMins - targetMins)
    if (diff > 60) {
      const halfway = Math.round((currentMins + targetMins) / 2 / 60)
      return Math.max(0, Math.min(23, halfway))
    }
  }
  return base
}

/* ─── Scheduling ─── */

export function scheduleDailyNudge(
  dayStartHour: number,
  taskCount: number,
  driftCount: number,
  suppressionLevel = 0,
  lastNudgeDate: string | null = null,
  quietHoursStart?: string,
  quietHoursEnd?: string,
  storedTimezoneOffset = 0,
): boolean {
  if (!isNotificationSupported()) return false
  if (getStoredPermission() !== 'granted') return false

  if (!shouldNudgeToday(suppressionLevel, lastNudgeDate, dayStartHour)) return false

  const timezoneShift = detectTimezoneShift(storedTimezoneOffset)
  const nudgeHour = getAdaptedNudgeHour(dayStartHour, timezoneShift)
  const now = new Date()
  const target = new Date(now)
  target.setHours(nudgeHour, 0, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  if (quietHoursStart && quietHoursEnd) {
    const check = new Date(target)
    const h = check.getHours()
    const m = check.getMinutes()
    const mins = h * 60 + m
    const startParts = quietHoursStart.split(':').map(Number)
    const endParts = quietHoursEnd.split(':').map(Number)
    const startMins = startParts[0] * 60 + startParts[1]
    const endMins = endParts[0] * 60 + endParts[1]
    let inQuiet = false
    if (startMins <= endMins) {
      inQuiet = mins >= startMins && mins < endMins
    } else {
      inQuiet = mins >= startMins || mins < endMins
    }
    if (inQuiet) {
      target.setHours(endParts[0] + 1, 0, 0, 0)
    }
  }

  const msUntilNudge = target.getTime() - now.getTime()
  const content = getNudgeContent(taskCount, driftCount)

  const existing = (globalThis as Record<string, unknown>).__nudgeTimer
  if (typeof existing === 'number') clearTimeout(existing)

  ;(globalThis as Record<string, unknown>).__nudgeTimer = window.setTimeout(() => {
    if (quietHoursStart && quietHoursEnd && isInQuietHours(quietHoursStart, quietHoursEnd)) return
    try {
      new Notification(content.title, {
        body: content.body,
        tag: DAILY_NUDGE_ID,
        silent: true,
      })
    } catch {
    }
  }, msUntilNudge)

  return true
}

export function cancelDailyNudge() {
  const existing = (globalThis as Record<string, unknown>).__nudgeTimer
  if (typeof existing === 'number') {
    clearTimeout(existing)
    ;(globalThis as Record<string, unknown>).__nudgeTimer = null
  }
}

/* ─── Nudge response tracking ─── */

export function markNudgeSeen() {
  try {
    localStorage.setItem(NUDGE_RESPONSE_KEY, Date.now().toString())
  } catch {
  }
}

export function getLastSeenTimestamp(): number {
  try {
    return Number(localStorage.getItem(NUDGE_RESPONSE_KEY)) || 0
  } catch {
    return 0
  }
}

/* ─── Focus window alerts ─── */

export interface FocusWindowAlert {
  taskId: string
  taskTitle: string
  windowEnd: string
}

const pendingFocusAlerts: FocusWindowAlert[] = []
let focusAlertTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleFocusWindowAlert(
  alert: FocusWindowAlert,
  quietHoursStart?: string,
  quietHoursEnd?: string,
): boolean {
  if (!isNotificationSupported()) return false
  if (getStoredPermission() !== 'granted') return false

  if (quietHoursStart && quietHoursEnd) {
    if (isInQuietHours(quietHoursStart, quietHoursEnd)) return false
  }

  const now = new Date()
  const [hours, minutes] = alert.windowEnd.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)

  if (target <= now) return false

  pendingFocusAlerts.push(alert)
  scheduleBundledAlert(target, quietHoursStart, quietHoursEnd)
  return true
}

function scheduleBundledAlert(target: Date, quietHoursStart?: string, quietHoursEnd?: string) {
  if (focusAlertTimer) clearTimeout(focusAlertTimer)

  const msUntil = target.getTime() - Date.now()
  focusAlertTimer = setTimeout(() => {
    if (quietHoursStart && quietHoursEnd && isInQuietHours(quietHoursStart, quietHoursEnd)) return

    const alerts = [...pendingFocusAlerts]
    pendingFocusAlerts.length = 0

    if (alerts.length === 1) {
      try {
        new Notification('Focus window ended', {
          body: `"${alerts[0].taskTitle}" focus window has passed.`,
          tag: `focus-${alerts[0].taskId}`,
          silent: true,
        })
      } catch {
      }
    } else if (alerts.length > 1) {
      try {
        new Notification('Focus windows ended', {
          body: `${alerts.length} focus windows have passed.`,
          tag: 'focus-bundled',
          silent: true,
        })
      } catch {
      }
    }
  }, msUntil)
}

export function cancelFocusAlerts() {
  if (focusAlertTimer) {
    clearTimeout(focusAlertTimer)
    focusAlertTimer = null
  }
  pendingFocusAlerts.length = 0
}
