'use client'

import { useState } from 'react'
import { useCategoryStore, PRESET_COLORS } from '@/stores/categoryStore'

export function CategoryManager() {
  const categories = useCategoryStore((s) => s.categories)
  const addCategory = useCategoryStore((s) => s.addCategory)
  const updateCategory = useCategoryStore((s) => s.updateCategory)
  const deleteCategory = useCategoryStore((s) => s.deleteCategory)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [newEmoji, setNewEmoji] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    await addCategory(newName.trim(), newColor, newEmoji || undefined)
    setNewName('')
    setNewEmoji('')
  }

  function startEdit(cat: typeof categories[0]) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditEmoji(cat.emoji ?? '')
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return
    await updateCategory(editingId, {
      name: editName.trim(),
      color: editColor,
      emoji: editEmoji || null,
    })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deleteCategory(id)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--text-primary)]">Categories</h3>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] p-2">
            {editingId === cat.id ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                />
                <input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  maxLength={2}
                  className="w-10 rounded bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                        className={`h-4 w-4 rounded-full ${editColor === c ? 'ring-2 ring-[var(--bg-surface)]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={handleSaveEdit} className="btn-ghost text-xs text-[var(--accent)]">Save</button>
                <button onClick={() => setEditingId(null)} className="btn-ghost text-xs">Cancel</button>
              </div>
            ) : (
              <>
                <span className="text-sm">{cat.emoji}</span>
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm text-[var(--text-primary)]">{cat.name}</span>
                <button onClick={() => startEdit(cat)} className="btn-ghost text-[10px]">
                  Edit
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn-ghost text-[10px] text-[var(--text-ghost)] hover:text-[var(--warn)]">
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-md bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-ghost)]"
        />
        <input
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          placeholder="Emoji"
          maxLength={2}
          className="w-12 rounded-md bg-[var(--bg-elevated)] px-2 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
        <div className="flex gap-1">
          {PRESET_COLORS.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
               className={`h-4 w-4 rounded-full ${newColor === c ? 'ring-2 ring-[var(--bg-surface)]' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary px-3 py-1 text-xs"
        >
          Add
        </button>
      </div>
    </div>
  )
}
