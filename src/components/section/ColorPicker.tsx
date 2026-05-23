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
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
          className={`h-5 w-5 rounded-full transition-all ${
            value === color ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-surface)]' : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
