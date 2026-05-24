'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { useFocusStore } from '@/stores/focusStore'
import { TaskSection } from '@/components/task/TaskSection'
import { TaskCard } from '@/components/task/TaskCard'
import { SectionEditor } from '@/components/section/SectionEditor'
import { CategoryFilterBar } from '@/components/category/CategoryFilterBar'
import { DayPulse } from '@/components/home/DayPulse'
import { DateStrip } from '@/components/home/DateStrip'
import { InlineComposer } from '@/components/home/InlineComposer'
import type { FlowSection, EnergyType } from '@/types'
import { EmptyDay } from '@/components/empty/EmptyDay'

function today() { return new Date().toISOString().slice(0, 10) }

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
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const [showCompleted, setShowCompleted] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<FlowSection | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(today())
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null)
  const [showTransition, setShowTransition] = useState(false)

  const activeTaskCount = tasks.filter((t) => t.status === 'active').length
  useEffect(() => {
    updateWorkload(activeTaskCount)
  }, [activeTaskCount, updateWorkload])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTaskComplete(taskId: string) {
    setLastCompletedId(taskId)
    setShowTransition(true)
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    transitionTimeoutRef.current = setTimeout(() => {
      setShowTransition(false)
      setLastCompletedId(null)
    }, 4000)
  }

  function getTransitionContent() {
    const active = activeTasks.filter((t) => t.status === 'active')
    const completedTask = tasks.find((t) => t.id === lastCompletedId)
    const section = sections.find((s) => s.id === completedTask?.flowSectionId)
    const remainingInSection = active.filter(
      (t) => t.flowSectionId === completedTask?.flowSectionId,
    )
    const nextTask = remainingInSection.length > 0
      ? remainingInSection.sort((a, b) => a.sortOrder - b.sortOrder)[0]
      : null
    const isAllDone = active.length === 0
    const isLate = new Date().getHours() >= 21

    if (isAllDone) {
      return { title: 'Everything done.', subtitle: '', actions: [] }
    }
    if (isLate) {
      return { title: 'That is one less thing.', subtitle: '', actions: [] }
    }
    if (nextTask) {
      return { title: `Up next: ${nextTask.title}`, subtitle: '', actions: [] }
    }
    if (section && remainingInSection.length === 0) {
      return {
        title: `${section.name} done.`,
        subtitle: `The rest of the day has ${active.length} tasks waiting.`,
        actions: [],
      }
    }
    return { title: '', subtitle: '', actions: [] }
  }

  const dateTasks = tasks.filter((t) => t.date === selectedDate)
  const activeTasks = dateTasks.filter((t) => t.status === 'active')
  const completedTasks = dateTasks.filter((t) => t.status === 'completed')

  const filteredActive = filterCategoryId
    ? activeTasks.filter((t) => t.categoryId === filterCategoryId)
    : activeTasks

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
        <DayPulse tasks={dateTasks} date={selectedDate} />
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

  return (
    <div className="px-4">
      <header className="mb-4 mt-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
            Flow
          </h1>
          <button
            onClick={openNewSection}
            aria-label="Add section"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2v8M2 6h8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <DayPulse tasks={dateTasks} date={selectedDate} />
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
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
            date={selectedDate}
            onEditSection={handleEditSection}
            onTaskComplete={handleTaskComplete}
          />
        )
      })}

      <AnimatePresence>
        {showTransition && lastCompletedId && (() => {
          const content = getTransitionContent()
          return (
            <motion.div
              key="transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-4 ml-4 border-l border-[var(--bg-elevated)] pl-3"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-2"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    d="M5 10l3 3 7-7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
              </motion.div>
              {content.title && (
                <p className={`font-serif text-base ${content.title === 'Everything done.' ? 'text-lg' : ''} text-[var(--text-primary)]`}>
                  {content.title}
                </p>
              )}
              {content.subtitle && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{content.subtitle}</p>
              )}
              <button
                onClick={() => { setShowTransition(false); setLastCompletedId(null) }}
                className="mt-2 text-[10px] text-[var(--text-ghost)] transition-colors hover:text-[var(--text-muted)]"
              >
                Dismiss
              </button>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-[var(--bg-elevated)] pt-4">
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
            <div className="ml-4 mt-2 border-l border-[var(--bg-elevated)] pl-3">
              <AnimatePresence mode="popLayout">
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
                  />
                ))}
              </AnimatePresence>
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
