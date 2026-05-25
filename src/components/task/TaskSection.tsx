'use client'

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'
import { SectionHeader } from '@/components/section/SectionHeader'
import { useTaskStore } from '@/stores/taskStore'
import { useFlowSectionStore } from '@/stores/flowSectionStore'
import { useConfirmStore } from '@/stores/confirmStore'
import { useDragReorder } from '@/hooks/useDragReorder'
import type { Task, FlowSection } from '@/types'

interface TaskSectionProps {
  section: FlowSection
  tasks: Task[]
  date: string
  onEditSection: (section: FlowSection) => void
  onTaskComplete?: (taskId: string) => void
}

export function TaskSection({ section, tasks, date, onEditSection, onTaskComplete }: TaskSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [sectionDragOverId, setSectionDragOverId] = useState<string | null>(null)
  const [dragCancelKey, setDragCancelKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const batchReorder = useTaskStore((s) => s.batchReorder)
  const deleteSection = useFlowSectionStore((s) => s.deleteSection)
  const batchSectionReorder = useFlowSectionStore((s) => s.batchReorder)
  const allSections = useFlowSectionStore((s) => s.sections)
  const { handleDragMove, reset: resetAutoScroll } = useDragReorder({
    containerRef,
  })

  const nextSortOrder = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.sortOrder)) + 1
    : 0

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
    handleDragMove(e.clientY)
  }

  function handleDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(related)) {
      setDragOverId(null)
    }
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    resetAutoScroll()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId === targetId) return

    const draggedTask = tasks.find((t) => t.id === draggedId)
    const targetTask = tasks.find((t) => t.id === targetId)
    if (!draggedTask || !targetTask) return

    const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIdx = sorted.findIndex((t) => t.id === draggedId)
    const toIdx = sorted.findIndex((t) => t.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    const updates = reordered.map((t, i) => ({
      id: t.id,
      sortOrder: i,
      flowSectionId: section.id,
    }))

    batchReorder(updates)
  }

  function handleDragEnd() {
    setDragOverId(null)
    setDragCancelKey((k) => k + 1)
    resetAutoScroll()
  }

  function handleMoveUp(id: string) {
    const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((t) => t.id === id)
    if (idx <= 0) return
    const reordered = [...sorted]
    ;[reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]]
    const updates = reordered.map((t, i) => ({
      id: t.id,
      sortOrder: i,
      flowSectionId: section.id,
    }))
    batchReorder(updates)
  }

  function handleMoveDown(id: string) {
    const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((t) => t.id === id)
    if (idx === -1 || idx >= sorted.length - 1) return
    const reordered = [...sorted]
    ;[reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]]
    const updates = reordered.map((t, i) => ({
      id: t.id,
      sortOrder: i,
      flowSectionId: section.id,
    }))
    batchReorder(updates)
  }

  function handleSectionDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSectionDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setSectionDragOverId(id)
  }

  function handleSectionDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setSectionDragOverId(null)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId === targetId) return

    const sorted = [...allSections].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIdx = sorted.findIndex((s) => s.id === draggedId)
    const toIdx = sorted.findIndex((s) => s.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    const updates = reordered.map((s, i) => ({
      id: s.id,
      sortOrder: i,
    }))

    batchSectionReorder(updates)
  }

  function handleSectionDragEnd() {
    setSectionDragOverId(null)
  }

  function handleDeleteSection() {
    useConfirmStore.getState().show({
      message: `Delete "${section.name}" section?`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteSection(section.id),
    })
  }

  const sectionIndex = allSections.findIndex((s) => s.id === section.id)

  return (
    <div className="mb-6">
      <SectionHeader
        section={section}
        taskCount={tasks.length}
        onEdit={onEditSection}
        onDelete={handleDeleteSection}
        onDragStart={handleSectionDragStart}
        onDragOver={handleSectionDragOver}
        onDrop={handleSectionDrop}
        onDragEnd={handleSectionDragEnd}
        isDragTarget={sectionDragOverId === section.id}
        sectionIndex={sectionIndex}
        totalSections={allSections.length}
        onMoveSection={(id, dir) => {
          const sorted = [...allSections].sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = sorted.findIndex((s) => s.id === id)
          if (idx === -1) return
          if (dir === 'up' && idx === 0) return
          if (dir === 'down' && idx === sorted.length - 1) return
          const reordered = [...sorted]
          const swapIdx = dir === 'up' ? idx - 1 : idx + 1
          ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
          const updates = reordered.map((s, i) => ({ id: s.id, sortOrder: i }))
          batchSectionReorder(updates)
        }}
      />

      <div ref={containerRef} className="ml-4 border-l border-[var(--bg-elevated)] pl-3" onDragLeave={handleDragLeave}>
        {tasks.length === 0 && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="py-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Tap + to add a task
          </button>
        )}

        <motion.div
          key={dragCancelKey}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => (
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
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragTarget={dragOverId === task.id}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={i === 0}
                isLast={i === tasks.length - 1}
                onComplete={onTaskComplete}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <AddTaskForm
          sectionId={section.id}
          date={date}
          sortOrder={nextSortOrder}
          isActive={isAdding}
          onActivate={() => setIsAdding(true)}
          onDeactivate={() => setIsAdding(false)}
        />
      </div>
    </div>
  )
}
