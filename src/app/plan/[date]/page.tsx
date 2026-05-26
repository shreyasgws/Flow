'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { TaskSection } from '@/components/task/TaskSection'
import { TaskCard } from '@/components/task/TaskCard'
import { SectionEditor } from '@/components/section/SectionEditor'
import { CategoryFilterBar } from '@/components/category/CategoryFilterBar'
import { DateStrip } from '@/components/home/DateStrip'
import { InlineComposer } from '@/components/home/InlineComposer'
import { EmptyDay } from '@/components/empty/EmptyDay'
import type { FlowSection, EnergyType } from '@/types'

function today() { return new Date().toISOString().slice(0, 10) }

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const EMPTY_SECTION_FORM = {
  name: '',
  startTime: '09:00',
  endTime: '10:00',
  atmosphereColor: '#B8A88A',
  energyType: null as EnergyType | null,
  icon: null as string | null,
}

export default function PlanPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = use(params)
  const router = useRouter()
  const tasks = useTaskStore((s) => s.tasks)
  const sections = useFlowSectionStore((s) => s.sections)
  const addSection = useFlowSectionStore((s) => s.addSection)
  const updateSection = useFlowSectionStore((s) => s.updateSection)
  const updateWorkload = useEnvironmentStore((s) => s.updateWorkload)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<FlowSection | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const isFuture = date > today()

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const dateTasks = tasks.filter((t) => t.date === date)
  const activeTasks = dateTasks.filter((t) => t.status === 'active')
  const completedTasks = dateTasks.filter((t) => t.status === 'completed')

  const filteredActive = filterCategoryId
    ? activeTasks.filter((t) => t.categoryId === filterCategoryId)
    : activeTasks

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

  if (!isFuture) {
    return (
      <div className="px-4">
        <header className="mb-4 mt-2">
          <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
            {formatDateLabel(date)}
          </h1>
        </header>
        <p className="text-sm text-[var(--text-secondary)]">
          Planning is available for future dates only.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="btn-primary mt-4"
        >
          Back to today
        </button>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="px-4">
        <header className="mb-4 mt-2">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
              {formatDateLabel(date)}
            </h1>
          </div>
        </header>
        <div className="mt-16 text-center">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Plan ahead. Create sections for your day.
          </p>
          <button
            onClick={openNewSection}
            className="btn-primary"
          >
            Create your first section
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4">
      <header className="mb-4 mt-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
            {formatDateLabel(date)}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={openNewSection}
              aria-label="Add section"
              className="btn-ghost"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M7 2v10M2 7h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <DateStrip selectedDate={date} onSelectDate={(d) => router.push(`/plan/${d}`)} />
      <CategoryFilterBar activeId={filterCategoryId} onChange={setFilterCategoryId} />

      {filteredActive.length === 0 && completedTasks.length > 0 && (
        <EmptyDay variant="completed" completedCount={completedTasks.length} sectionCount={sections.length} />
      )}
      {filteredActive.length === 0 && completedTasks.length === 0 && sections.length > 0 && (
        <EmptyDay variant="zero-task" />
      )}

      {sections.map((section) => {
        const sectionTasks = filteredActive.filter(
          (t) => t.flowSectionId === section.id,
        )
        if (sectionTasks.length === 0 && filterCategoryId) return null
        return (
          <TaskSection
            key={section.id}
            section={section}
            tasks={sectionTasks}
            date={date}
            onEditSection={handleEditSection}
          />
        )
      })}

      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-[var(--border)] pt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            aria-expanded={showCompleted}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <span className={`inline-block transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {completedTasks.length} completed
          </button>

          {showCompleted && (
            <div className="ml-4 mt-2 border-l border-[var(--border)] pl-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  status={task.status}
                  estimatedMinutes={task.estimatedMinutes}
                  categoryId={task.categoryId}
                  frictionLevel={task.frictionLevel}
                  sortOrder={task.sortOrder}
                  isRecurring={task.isRecurring}
                  recurrenceType={task.recurrenceType}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <InlineComposer />

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
