'use client'

type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly'

interface RecurrencePickerProps {
  value: RecurrenceType
  onChange: (value: RecurrenceType) => void
}

const OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
]

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-2.5 py-0.5 text-[10px] transition-all ${
            value === opt.value
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
