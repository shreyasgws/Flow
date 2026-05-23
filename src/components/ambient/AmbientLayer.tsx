'use client'

import { useEnvironmentStore } from '@/stores/environmentStore'

function getTimeGradients(hour: number, warmth: number, isAmbient: boolean) {
  const intensity = isAmbient ? 1 : 0.15

  if (hour >= 5 && hour < 8) {
    return {
      top: `rgba(180, 140, 100, ${0.08 * warmth * intensity})`,
      bottom: `transparent`,
      radial: `radial-gradient(ellipse at 50% 0%, rgba(200, 160, 120, ${0.04 * warmth * intensity}) 0%, transparent 70%)`,
    }
  }
  if (hour >= 8 && hour < 17) {
    return {
      top: `rgba(91, 140, 255, ${0.06 * intensity})`,
      bottom: `transparent`,
      radial: `radial-gradient(ellipse at 50% 0%, rgba(91, 140, 255, ${0.03 + warmth * 0.05 * intensity}) 0%, transparent 70%)`,
    }
  }
  if (hour >= 17 && hour < 20) {
    return {
      top: `rgba(160, 100, 140, ${0.08 * warmth * intensity})`,
      bottom: `rgba(91, 140, 255, ${0.02 * intensity})`,
      radial: `radial-gradient(ellipse at 50% 0%, rgba(160, 100, 140, ${0.04 * warmth * intensity}) 0%, transparent 70%)`,
    }
  }
  return {
    top: `rgba(60, 60, 100, ${0.06 * intensity})`,
    bottom: `rgba(20, 20, 40, ${0.04 * intensity})`,
    radial: `radial-gradient(ellipse at 50% 0%, rgba(60, 60, 100, ${0.03 * intensity}) 0%, transparent 70%)`,
  }
}

export function AmbientLayer() {
  const env = useEnvironmentStore((s) => s.state)
  const grad = getTimeGradients(env.hour, env.ambientWarmth, env.mode === 'ambient')
  const noiseOpacity = env.mode === 'ambient' ? 0.03 + env.visualNoise * 0.04 : 0.005

  return (
    <>
      {/* Time-of-day gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `linear-gradient(180deg, ${grad.top} 0%, ${grad.bottom} 100%), ${grad.radial}`,
          transition: `opacity ${env.transitionSpeed}s, background ${env.transitionSpeed}s ease`,
          opacity: env.mode === 'ambient' ? 0.6 + env.ambientWarmth * 0.4 : 0.1,
        }}
      />

      {/* Ambient noise texture */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          opacity: noiseOpacity,
          transition: `opacity ${env.transitionSpeed}s`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          mixBlendMode: 'overlay',
          animation: env.mode === 'ambient' ? `ambientShift ${4 / env.motionIntensity}s ease-in-out infinite` : 'none',
        }}
      />

      {/* Warmth overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: env.ambientWarmth > 0.5
            ? `linear-gradient(180deg, rgba(255, 200, 150, ${(env.ambientWarmth - 0.5) * 0.03}) 0%, transparent 50%)`
            : `linear-gradient(180deg, rgba(100, 140, 255, ${(0.5 - env.ambientWarmth) * 0.03}) 0%, transparent 50%)`,
          transition: `opacity ${env.transitionSpeed}s, background ${env.transitionSpeed}s ease`,
        }}
      />
    </>
  )
}
