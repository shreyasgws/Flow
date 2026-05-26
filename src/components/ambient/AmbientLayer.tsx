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
      bloom: '#8B7FD6',
      bloomPosition: '50% 50%',
      bloomOpacity: 0.06 * warmth,
    }
  }
  if (hour >= 17 && hour < 20) {
    return {
      base: '#0B0D12',
      bloom: '#6B5FA8',
      bloomPosition: '20% 80%',
      bloomOpacity: 0.08 * warmth,
    }
  }
  return {
    base: '#09090F',
    bloom: '#5B4F96',
    bloomPosition: '50% 60%',
    bloomOpacity: 0.07 * warmth,
  }
}

function getOpacityVar(name: string): string {
  return `var(${name})`
}

const landscapePaths = [
  'M0,320 Q120,260 240,290 T480,250 T720,280 T960,240 T1200,270 T1440,250 L1440,400 L0,400Z',
  'M0,350 Q100,300 200,330 T400,290 T600,310 T800,270 T1000,300 T1200,280 T1440,300 L1440,400 L0,400Z',
  'M0,380 Q80,340 160,360 T320,330 T480,350 T640,320 T800,340 T960,310 T1120,340 T1280,320 T1440,350 L1440,400 L0,400Z',
]

function LandscapeSilhouette({ color, opacity }: { color: string; opacity: string }) {
  return (
    <div
      className="ambient-silhouette"
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        animation: 'ambientDrift1 30s ease-in-out infinite',
        animationPlayState: getOpacityVar('--ambient-play-state'),
        willChange: 'transform',
      }}
    >
      {landscapePaths.map((d, i) => (
        <svg
          key={i}
          viewBox="0 0 1440 400"
          preserveAspectRatio="xMidYMax slice"
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: `${55 + i * 10}%`,
            filter: `blur(${20 + i * 12}px)`,
            opacity: 1 - i * 0.15,
          }}
          aria-hidden="true"
        >
          <path d={d} fill={color} />
        </svg>
      ))}
    </div>
  )
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
      <LandscapeSilhouette color={config.bloom} opacity={getOpacityVar('--ambient-silhouette-op')} />
      <div
        className="ambient-drift"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 100% 80% at ${config.bloomPosition}, ${config.bloom}0D 0%, transparent 60%),
            radial-gradient(circle 200px at ${config.bloomPosition}, ${config.bloom}08 0%, transparent 70%)
          `,
          filter: 'blur(60px)',
          opacity: getOpacityVar('--ambient-haze-op'),
          animation: 'ambientDrift2 35s ease-in-out infinite',
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
