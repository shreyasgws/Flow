export type AtmosphereType = 'calm' | 'focus' | 'deep_night'

export interface AtmosphereConfig {
  warmth: number
  glowOpacity: number
  blurPx: number
  surfaceStyle: 'paper' | 'glass' | 'soft'
}

const ATMOSPHERE_PRESETS: Record<AtmosphereType, AtmosphereConfig> = {
  calm: { warmth: 0.5, glowOpacity: 0.03, blurPx: 8, surfaceStyle: 'paper' },
  focus: { warmth: 0.3, glowOpacity: 0.01, blurPx: 4, surfaceStyle: 'paper' },
  deep_night: { warmth: 0.1, glowOpacity: 0.06, blurPx: 12, surfaceStyle: 'soft' },
}

export function getAtmosphere(type: AtmosphereType, intensity = 1): AtmosphereConfig {
  const preset = ATMOSPHERE_PRESETS[type]
  return {
    warmth: preset.warmth,
    glowOpacity: preset.glowOpacity * intensity,
    blurPx: preset.blurPx,
    surfaceStyle: preset.surfaceStyle,
  }
}

export function atmosphereVars(config: AtmosphereConfig): Record<string, string> {
  return {
    '--atmosphere-warmth': String(config.warmth),
    '--atmosphere-glow-opacity': String(config.glowOpacity),
    '--atmosphere-blur': `${config.blurPx}px`,
  }
}
