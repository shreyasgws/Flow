'use client'

import { useState, useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { TaskSection } from '@/components/task/TaskSection'
import { TaskCard } from '@/components/task/TaskCard'
import { SectionEditor } from '@/components/section/SectionEditor'
import type { FlowSection, EnergyType } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY_SECTION_FORM = {
  name: '',
  startTime: '09:00',
  endTime: '10:00',
  atmosphereColor: '#B8A88A',
  energyType: null as EnergyType | null,
  icon: null as string | null,
}

export default function Home() {
  const tasks = useTaskStore((s) => s.tasks)
  const sections = useFlowSectionStore((s) => s.sections)
  const addSection = useFlowSectionStore((s) => s.addSection)
  const updateSection = useFlowSectionStore((s) => s.updateSection)
  const updateWorkload = useEnvironmentStore((s) => s.updateWorkload)
  const [showCompleted, setShowCompleted] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<FlowSection | null>(null)

  const activeTaskCount = tasks.filter((t) => t.status === 'active').length
  useEffect(() => {
    updateWorkload(activeTaskCount)
  }, [activeTaskCount, updateWorkload])

  function handleEditSection(section: FlowSection) {
    setEditingSection(section)
    setEditorOpen(true)
  }

  async function handleSaveEditor(data: {
    name: string
    startTime: string
    endTime: string
    atmosphereColor: string
    energyType: EnergyType | null
    icon: string | null
  }) {
    if (editingSection) {
      await updateSection(editingSection.id, data)
    } else {
      const maxOrder = sections.reduce((m, s) => Math.max(m, s.sortOrder), -1)
      await addSection({ ...data, sortOrder: maxOrder + 1 })
    }
  }

  function openNewSection() {
    setEditingSection(null)
    setEditorOpen(true)
  }

  if (sections.length === 0) {
    return (
      <div className="px-4">
        <header className="mb-6 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
                Flow
              </h1>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>
        <div className="mt-16 text-center">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            A lighter day can still move gently.
          </p>
          <button
            onClick={openNewSection}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
          >
            Create your first section
          </button>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => t.status === 'active')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const hasNoActiveTasks = activeTasks.length === 0

  return (
    <div className="px-4">
      <header className="mb-6 mt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
              Flow
            </h1>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={openNewSection}
            aria-label="Add section"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2v8M2 6h8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {hasNoActiveTasks && (
        <p className="mb-6 text-center text-xs text-[var(--text-muted)]">
          Nothing yet. Add what feels right.
        </p>
      )}

      {sections.map((section) => {
        const sectionTasks = activeTasks.filter(
          (t) => t.flowSectionId === section.id,
        )
        return (
          <TaskSection
            key={section.id}
            section={section}
            tasks={sectionTasks}
            date={TODAY}
            onEditSection={handleEditSection}
          />
        )
      })}

      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-[var(--bg-elevated)] pt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            aria-expanded={showCompleted}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <span
              className={`inline-block transition-transform ${showCompleted ? 'rotate-90' : ''}`}
            >
              ▶
            </span>
            {completedTasks.length} completed
          </button>

          {showCompleted && (
            <div className="ml-4 mt-2 border-l border-[var(--bg-elevated)] pl-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  status={task.status}
                  estimatedMinutes={task.estimatedMinutes}
                  sortOrder={task.sortOrder}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SectionEditor
        open={editorOpen}
        title={editingSection ? 'Edit Section' : 'New Section'}
        initial={
          editingSection
            ? {
                name: editingSection.name,
                startTime: editingSection.startTime,
                endTime: editingSection.endTime,
                atmosphereColor: editingSection.atmosphereColor,
                energyType: editingSection.energyType,
                icon: editingSection.icon,
              }
            : EMPTY_SECTION_FORM
        }
        onSave={handleSaveEditor}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}
