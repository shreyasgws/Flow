const DAILY_NUDGE_ID = 'daily-nudge'
const PERMISSION_KEY = 'notification-permission'

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

export interface NudgeContent {
  title: string
  body: string
}

export function getNudgeContent(taskCount: number, driftCount: number): NudgeContent {
  if (taskCount > 0) {
    return {
      title: 'Flow',
      body: `${taskCount} thing${taskCount > 1 ? 's' : ''} waiting today.`,
    }
  }
  if (driftCount > 0) {
    return {
      title: 'Flow',
      body: `You have ${driftCount} thought${driftCount > 1 ? 's' : ''} in drift.`,
    }
  }
  return {
    title: 'Flow',
    body: 'Nothing planned yet. Keep today simple.',
  }
}

export function scheduleDailyNudge(
  dayStartHour: number,
  taskCount: number,
  driftCount: number,
): boolean {
  if (!isNotificationSupported()) return false
  if (getStoredPermission() !== 'granted') return false

  const nudgeHour = dayStartHour + 2
  const now = new Date()
  const target = new Date(now)
  target.setHours(nudgeHour, 0, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  const msUntilNudge = target.getTime() - now.getTime()
  const content = getNudgeContent(taskCount, driftCount)

  const existing = (globalThis as Record<string, unknown>).__nudgeTimer
  if (typeof existing === 'number') clearTimeout(existing)

  ;(globalThis as Record<string, unknown>).__nudgeTimer = window.setTimeout(() => {
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

export interface FocusWindowAlert {
  taskId: string
  taskTitle: string
  windowEnd: string
}

export function scheduleFocusWindowAlert(alert: FocusWindowAlert): boolean {
  if (!isNotificationSupported()) return false
  if (getStoredPermission() !== 'granted') return false

  const now = new Date()
  const [hours, minutes] = alert.windowEnd.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)

  if (target <= now) {
    return false
  }

  const msUntilAlert = target.getTime() - now.getTime()

  setTimeout(() => {
    try {
      new Notification('Focus window ended', {
        body: `"${alert.taskTitle}" focus window has passed.`,
        tag: `focus-${alert.taskId}`,
        silent: true,
      })
    } catch {
    }
  }, msUntilAlert)

  return true
}
