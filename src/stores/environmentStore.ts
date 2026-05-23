import { create } from 'zustand'
import type { EnvironmentState, AmbientIntensity, EnvironmentMode } from '@/types'

export type PerformanceMode = 'low' | 'medium' | 'high'

function computeEnvironmentState(
  mode: EnvironmentMode,
  intensity: AmbientIntensity,
  hour: number,
  taskCount: number,
  performance: PerformanceMode,
): EnvironmentState {
  const perfFactor = performance === 'low' ? 0.3 : performance === 'medium' ? 0.65 : 1

  if (mode === 'static') {
    return {
      mode: 'static',
      intensity,
      contrastLevel: 1,
      motionIntensity: 1 * perfFactor,
      spacingDensity: 1,
      ambientWarmth: 0.5,
      transitionSpeed: 0.3,
      visualNoise: 0,
      hour,
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
    contrastLevel: 0.7 + timeFactor * 0.3 * intensityFactor * perfFactor,
    motionIntensity: (isNight ? 0.3 : 1) * intensityFactor * perfFactor,
    spacingDensity: 0.8 + workloadFactor * 0.4,
    ambientWarmth: warmth * intensityFactor * perfFactor,
    transitionSpeed: isNight ? 0.5 * perfFactor : perfFactor,
    visualNoise: intensityFactor * (isNight ? 0.1 : 0.3) * perfFactor,
    hour,
  }
}

let lastTaskCount = 0

interface EnvironmentStore {
  state: EnvironmentState
  performance: PerformanceMode
  updateTime: () => void
  updateWorkload: (taskCount: number) => void
  setMode: (mode: EnvironmentMode) => void
  setIntensity: (intensity: AmbientIntensity) => void
  setPerformance: (mode: PerformanceMode) => void
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  state: computeEnvironmentState('ambient', 'subtle', new Date().getHours(), 0, 'high'),
  performance: 'high',

  updateTime: () => {
    const hour = new Date().getHours()
    const current = get().state
    set({
      state: computeEnvironmentState(
        current.mode, current.intensity, hour, lastTaskCount, get().performance,
      ),
    })
  },

  updateWorkload: (taskCount: number) => {
    lastTaskCount = taskCount
    const current = get().state
    const hour = new Date().getHours()
    set({
      state: computeEnvironmentState(
        current.mode, current.intensity, hour, taskCount, get().performance,
      ),
    })
  },

  setMode: (mode: EnvironmentMode) => {
    const current = get().state
    const hour = new Date().getHours()
    set({ state: computeEnvironmentState(mode, current.intensity, hour, lastTaskCount, get().performance) })
  },

  setIntensity: (intensity: AmbientIntensity) => {
    const current = get().state
    const hour = new Date().getHours()
    set({
      state: computeEnvironmentState(current.mode, intensity, hour, lastTaskCount, get().performance),
    })
  },

  setPerformance: (performance: PerformanceMode) => {
    const current = get().state
    const hour = new Date().getHours()
    set({
      performance,
      state: computeEnvironmentState(current.mode, current.intensity, hour, lastTaskCount, performance),
    })
  },
}))
