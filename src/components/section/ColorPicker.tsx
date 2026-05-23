'use client'

const COLORS = [
  '#B8A88A', '#8AB8A8', '#888AB8', '#B88898',
  '#A8B888', '#B8A0A0', '#88A8B8', '#B8B088',
  '#A0B8A0', '#B098B8', '#B8A888', '#98B8A8',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-all hover:scale-110"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full ${
              value === color ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-surface)]' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        </button>
      ))}
    </div>
  )
}
