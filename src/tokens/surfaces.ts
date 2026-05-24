export type SurfaceStyle = 'paper' | 'glass' | 'soft'

export function surfaceClasses(style: SurfaceStyle): string {
  switch (style) {
    case 'paper':
      return 'bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl'
    case 'glass':
      return 'bg-[var(--bg-overlay)] backdrop-blur-xl text-[var(--text-primary)] rounded-2xl'
    case 'soft':
      return 'bg-[var(--bg-elevated)]/50 text-[var(--text-secondary)] rounded-lg'
  }
}

export function surfaceInline(style: SurfaceStyle): React.CSSProperties {
  switch (style) {
    case 'paper':
      return { background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: '12px' }
    case 'glass':
      return { background: 'var(--bg-overlay)', backdropFilter: 'blur(24px)', color: 'var(--text-primary)', borderRadius: '16px' }
    case 'soft':
      return { background: 'var(--bg-elevated)', opacity: 0.5, color: 'var(--text-secondary)', borderRadius: '8px' }
  }
}
