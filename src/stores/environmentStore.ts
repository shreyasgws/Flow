import { create } from 'zustand'
import type { EnvironmentState, AmbientIntensity, EnvironmentMode } from '@/types'

function computeEnvironmentState(
  mode: EnvironmentMode,
  intensity: AmbientIntensity,
  hour: number,
  taskCount: number,
): EnvironmentState {
  if (mode === 'static') {
    return {
      mode: 'static',
      intensity,
      contrastLevel: 1,
      motionIntensity: 1,
      spacingDensity: 1,
      ambientWarmth: 0.5,
      transitionSpeed: 1,
      visualNoise: 0,
    }
  }

  const isNight = hour < 6 || hour >= 21
  const isMorning = hour >= 6 && hour < 12
  const isAfternoon = hour >= 12 && hour < 17
  const isEvening = hour >= 17 && hour < 21

  const timeFactor = isNight ? 0.3 : isMorning ? 0.7 : isAfternoon ? 0.8 : 0.5
  const warmth = isMorning ? 0.8 : isAfternoon ? 0.5 : 0.3
  const workloadFactor = Math.min(taskCount / 10, 1)

  const intensityFactor =
    intensity === 'full' ? 1 : intensity === 'subtle' ? 0.5 : 0.2

  return {
    mode,
    intensity,
    contrastLevel: 0.7 + timeFactor * 0.3 * intensityFactor,
    motionIntensity: (isNight ? 0.3 : 1) * intensityFactor,
    spacingDensity: 0.8 + workloadFactor * 0.4,
    ambientWarmth: warmth * intensityFactor,
    transitionSpeed: isNight ? 0.5 : 1,
    visualNoise: intensityFactor * (isNight ? 0.1 : 0.3),
  }
}

let lastTaskCount = 0

interface EnvironmentStore {
  state: EnvironmentState
  updateTime: () => void
  updateWorkload: (taskCount: number) => void
  setMode: (mode: EnvironmentMode) => void
  setIntensity: (intensity: AmbientIntensity) => void
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  state: computeEnvironmentState('ambient', 'subtle', new Date().getHours(), 0),

  updateTime: () => {
    const hour = new Date().getHours()
    const current = get().state
    set({
      state: computeEnvironmentState(
        current.mode,
        current.intensity,
        hour,
        lastTaskCount,
      ),
    })
  },

  updateWorkload: (taskCount: number) => {
    lastTaskCount = taskCount
    const current = get().state
    const hour = new Date().getHours()
    set({
      state: computeEnvironmentState(
        current.mode,
        current.intensity,
        hour,
        taskCount,
      ),
    })
  },

  setMode: (mode: EnvironmentMode) => {
    const current = get().state
    const hour = new Date().getHours()
    set({ state: computeEnvironmentState(mode, current.intensity, hour, lastTaskCount) })
  },

  setIntensity: (intensity: AmbientIntensity) => {
    const current = get().state
    const hour = new Date().getHours()
    set({
      state: computeEnvironmentState(current.mode, intensity, hour, lastTaskCount),
    })
  },
}))
