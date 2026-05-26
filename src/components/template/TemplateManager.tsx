'use client'

import { useEffect, useState } from 'react'
import { useTemplateStore } from '@/stores/templateStore'

export function TemplateManager() {
  const templates = useTemplateStore((s) => s.templates)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)
  const updateTemplate = useTemplateStore((s) => s.updateTemplate)
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setEditName(currentName)
  }

  async function handleSaveRename() {
    if (!editingId || !editName.trim()) return
    await updateTemplate(editingId, { name: editName.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id)
  }

  if (templates.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--text-primary)]">Templates</h3>
      <div className="space-y-1">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2">
            {editingId === t.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                />
                <button onClick={handleSaveRename} className="btn-ghost text-xs text-[var(--accent)]">Save</button>
                <button onClick={() => setEditingId(null)} className="btn-ghost text-xs">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-[var(--text-primary)]">{t.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{t.tasks.length} tasks</span>
                <button onClick={() => startEdit(t.id, t.name)} className="btn-ghost text-[10px]">Rename</button>
                <button onClick={() => handleDelete(t.id)} className="btn-ghost text-[10px] text-[var(--text-ghost)] hover:text-[var(--warn)]">Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
