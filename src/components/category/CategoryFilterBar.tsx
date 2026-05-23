'use client'

import { useCategoryStore } from '@/stores/categoryStore'

interface CategoryFilterBarProps {
  activeId: string | null
  onChange: (id: string | null) => void
}

export function CategoryFilterBar({ activeId, onChange }: CategoryFilterBarProps) {
  const categories = useCategoryStore((s) => s.categories)
  if (categories.length === 0) return null

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-colors ${
          activeId === null
            ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id === activeId ? null : cat.id)}
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-all`}
          style={{
            backgroundColor: cat.id === activeId ? `${cat.color}30` : `${cat.color}10`,
            color: cat.id === activeId ? cat.color : `${cat.color}aa`,
          }}
        >
          {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  )
}
