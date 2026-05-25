'use client'

import { useDeviceTier, getTierBooleans } from '@/lib/deviceTier'
import { useEnvironmentStore } from '@/stores/environmentStore'

function getTimeConfig(hour: number, warmth: number) {
  if (hour >= 5 && hour < 8) {
    return {
      base: '#0F0E0C',
      bloom: '#C8832A',
      bloomPosition: '80% 20%',
      bloomOpacity: 0.08 * warmth,
    }
  }
  if (hour >= 8 && hour < 17) {
    return {
      base: '#0D0D11',
      bloom: '#5B8CFF',
      bloomPosition: '50% 50%',
      bloomOpacity: 0.06 * warmth,
    }
  }
  if (hour >= 17 && hour < 20) {
    return {
      base: '#0B0D12',
      bloom: '#3A5A7A',
      bloomPosition: '20% 80%',
      bloomOpacity: 0.08 * warmth,
    }
  }
  return {
    base: '#09090F',
    bloom: '#4A3070',
    bloomPosition: '50% 60%',
    bloomOpacity: 0.07 * warmth,
  }
}

function getOpacityVar(name: string): string {
  return `var(${name})`
}

export function AmbientLayer() {
  const tier = useDeviceTier()
  const { isMinimal, isStandard, isFull } = getTierBooleans(tier)
  const env = useEnvironmentStore((s) => s.state)
  const config = getTimeConfig(env.hour, env.ambientWarmth)

  if (isMinimal) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: config.base,
          transition: `background-color var(--dur-ambient) linear`,
        }}
      />
    )
  }

  if (isStandard) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: config.base,
          transition: `background-color var(--dur-ambient) linear`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 60% at ${config.bloomPosition}, ${config.bloom}${Math.round(config.bloomOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundColor: config.base,
        transition: `background-color var(--dur-ambient) linear`,
      }}
    >
      <div
        className="ambient-silhouette"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 40% at 50% 70%, ${config.bloom}14 0%, transparent 60%)`,
          filter: 'blur(40px)',
          opacity: getOpacityVar('--ambient-silhouette-op'),
          animation: 'ambientDrift1 30s ease-in-out infinite',
          animationPlayState: getOpacityVar('--ambient-play-state'),
          willChange: 'transform',
        }}
      />
      <div
        className="ambient-haze"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 100% 80% at ${config.bloomPosition}, ${config.bloom}0D 0%, transparent 60%)`,
          filter: 'blur(60px)',
          opacity: getOpacityVar('--ambient-haze-op'),
          animation: 'ambientDrift2 40s ease-in-out infinite',
          animationPlayState: getOpacityVar('--ambient-play-state'),
          willChange: 'transform',
        }}
      />
      <div
        className="ambient-bloom"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 200px at ${config.bloomPosition}, ${config.bloom}08 0%, transparent 70%)`,
          opacity: getOpacityVar('--ambient-bloom-op'),
          animation: 'ambientDrift3 25s ease-in-out infinite',
          animationPlayState: getOpacityVar('--ambient-play-state'),
          willChange: 'transform',
        }}
      />
      <div
        className="ambient-grain"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: getOpacityVar('--ambient-grain-op'),
        }}
      />
      <AmbientParticles />
    </div>
  )
}

function AmbientParticles() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'white',
            left: `${[15, 45, 75][i]}%`,
            bottom: '10%',
            opacity: getOpacityVar('--ambient-particle-op'),
            animation: `particleFloat ${[20, 30, 25][i]}s linear infinite`,
            animationDelay: `${[0, 8, 16][i]}s`,
            animationPlayState: getOpacityVar('--ambient-play-state'),
            willChange: 'transform',
          }}
        />
      ))}
    </>
  )
}
