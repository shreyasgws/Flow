'use client'

import { useCategoryStore, PRESET_COLORS } from '@/stores/categoryStore'
import { useState } from 'react'

interface CategoryPickerProps {
  value: string | null
  onChange: (categoryId: string | null) => void
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const categories = useCategoryStore((s) => s.categories)
  const addCategory = useCategoryStore((s) => s.addCategory)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [newEmoji, setNewEmoji] = useState('')

  async function handleCreate() {
    if (!newName.trim()) return
    const cat = await addCategory(newName.trim(), newColor, newEmoji || undefined)
    if (cat) {
      onChange(cat.id)
      setShowNew(false)
      setNewName('')
      setNewEmoji('')
    }
  }

  const selected = categories.find((c) => c.id === value)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange(null)}
          className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
            value === null
              ? 'bg-[var(--accent)]/20 text-[var(--accent)] ring-1 ring-[var(--accent)]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          None
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`rounded-full px-3 py-1 text-[11px] transition-all`}
            style={{
              backgroundColor: cat.id === value ? `${cat.color}30` : `${cat.color}10`,
              color: cat.id === value ? cat.color : `${cat.color}aa`,
              boxShadow: cat.id === value ? `0 0 0 1px ${cat.color}` : 'none',
            }}
          >
            {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => setShowNew(!showNew)}
          className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          + New
        </button>
      </div>

      {showNew && (
        <div className="space-y-2 rounded-lg bg-[var(--bg-surface)] p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="w-full rounded-md bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)]"
          />
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="Emoji (optional)"
            maxLength={2}
            className="w-full rounded-md bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)]"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`h-5 w-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-[var(--bg-surface)]' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="rounded-full bg-[var(--accent)] px-4 py-1 text-xs text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="rounded-full bg-[var(--bg-elevated)] px-4 py-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selected && (
        <p className="text-[10px] text-[var(--text-ghost)]">
          {selected.emoji} {selected.name}
        </p>
      )}
    </div>
  )
}
