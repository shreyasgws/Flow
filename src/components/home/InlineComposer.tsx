'use client'

import { useState, useCallback } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'

export function InlineComposer() {
  const addTask = useTaskStore((s) => s.addTask)
  const sections = useFlowSectionStore((s) => s.sections)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const defaultSection = sections.length > 0 ? sections[0].id : null

  const submit = useCallback(async () => {
    if (!text.trim() || loading) return
    setLoading(true)
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
    setLoading(false)
  }, [text, loading, defaultSection, addTask])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)]/85 px-3 ring-1 ring-[var(--border)] backdrop-blur-lg transition-all focus-within:ring-[var(--border-active)]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to happen today?"
            disabled={loading}
            className="flex-1 bg-transparent px-1 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || loading}
            aria-label="Add task"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-30 disabled:active:scale-100"
          >
            {loading ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M7 2v10M2 7h10" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
