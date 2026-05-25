type HapticPattern = number | number[]

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

function vibrate(pattern: HapticPattern): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate(pattern)
  } catch {
  }
}

export function hapticSoftTap(): void {
  vibrate(10)
}

export function hapticGentleReturn(): void {
  vibrate([8, 30, 8])
}

export function hapticDragPickup(): void {
  vibrate(20)
}

export function hapticDropCommit(): void {
  vibrate(15)
}
