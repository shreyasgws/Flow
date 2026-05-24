export type MotionPreset = 'soft' | 'breathing' | 'still'

export interface MotionValue {
  durationMs: number
  duration: number
  ease: [number, number, number, number]
}

const MOTION_BASE: Record<MotionPreset, { durationMs: number; ease: [number, number, number, number] }> = {
  soft: { durationMs: 400, ease: [0.4, 0, 0.2, 1] },
  breathing: { durationMs: 6000, ease: [0.45, 0, 0.55, 1] },
  still: { durationMs: 0, ease: [0, 0, 1, 1] },
}

let _reducedMotion = false

export function setReducedMotion(reduced: boolean) {
  _reducedMotion = reduced
}

export function getReducedMotion(): boolean {
  return _reducedMotion
}

export function motionValue(
  preset: MotionPreset,
  intensity: number = 1,
): MotionValue {
  const base = MOTION_BASE[preset]
  const effective = _reducedMotion && preset !== 'still' ? 0 : base.durationMs * intensity
  return {
    durationMs: effective,
    duration: effective / 1000,
    ease: base.ease,
  }
}

export function motionTransition(
  preset: MotionPreset,
  intensity: number = 1,
): { duration: number; ease: [number, number, number, number] } {
  const mv = motionValue(preset, intensity)
  return { duration: mv.duration, ease: mv.ease }
}
