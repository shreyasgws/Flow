'use client'

import { useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'

export function InlineComposer() {
  const addTask = useTaskStore((s) => s.addTask)
  const sections = useFlowSectionStore((s) => s.sections)
  const [text, setText] = useState('')

  const defaultSection = sections.length > 0 ? sections[0].id : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const date = new Date().toISOString().slice(0, 10)
    const maxOrder = useTaskStore.getState().tasks
      .filter((t) => t.date === date)
      .reduce((m, t) => Math.max(m, t.sortOrder), -1)
    await addTask({
      title: text.trim(),
      flowSectionId: defaultSection,
      date,
      sortOrder: maxOrder + 1,
      estimatedMinutes: null,
      isRecurring: false,
      recurrenceType: 'none',
      recurrenceBaseId: null,
      sourceDriftId: null,
      frictionLevel: null,
      focusWindowStart: null,
      focusWindowEnd: null,
      completedAt: null,
    })
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="fixed bottom-20 left-0 right-0 z-30 px-4">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-lg ring-1 ring-[var(--bg-elevated)]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to happen today?"
            className="w-full bg-transparent px-5 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>
    </form>
  )
}
