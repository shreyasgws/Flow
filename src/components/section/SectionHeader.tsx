'use client'

import { motion } from 'motion/react'
import { emotionalMotionProps } from '@/lib/emotionalStates'
import type { FlowSection, EnergyType } from '@/types'

const ENERGY_LABELS: Record<EnergyType, string> = {
  deep_focus: 'Deep Focus',
  light_tasks: 'Light Tasks',
  recovery: 'Recovery',
  creative: 'Creative',
  social: 'Social',
  reflection: 'Reflection',
}

interface SectionHeaderProps {
  section: FlowSection
  taskCount: number
  onEdit: (section: FlowSection) => void
  onDelete: (id: string) => void
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragTarget?: boolean
}

export function SectionHeader({
  section,
  taskCount,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
}: SectionHeaderProps) {
  function handleDragStart(e: React.DragEvent) {
    onDragStart?.(e, section.id)
  }

  function handleDragOver(e: React.DragEvent) {
    onDragOver?.(e, section.id)
  }

  function handleDrop(e: React.DragEvent) {
    onDrop?.(e, section.id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      className={`group -mx-4 mb-2 flex cursor-grab items-center gap-2 px-4 py-1.5 active:cursor-grabbing ${
        isDragTarget ? 'rounded-lg bg-[var(--ambient-glow)]' : ''
      }`}
    >
      <span className="shrink-0 text-[var(--text-ghost)] opacity-0 transition-opacity group-hover:opacity-100">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="2" r="1.2" />
          <circle cx="7" cy="2" r="1.2" />
          <circle cx="3" cy="7" r="1.2" />
          <circle cx="7" cy="7" r="1.2" />
          <circle cx="3" cy="12" r="1.2" />
          <circle cx="7" cy="12" r="1.2" />
        </svg>
      </span>

      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: section.atmosphereColor }}
      />
      <h2 className="text-sm font-medium text-[var(--text-primary)]">{section.name}</h2>
      <span className="text-[10px] text-[var(--text-muted)]">
        {section.startTime}–{section.endTime}
      </span>
      {section.energyType && (
        <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
          {ENERGY_LABELS[section.energyType]}
        </span>
      )}
      {taskCount > 0 && (
        <span className="ml-auto text-[10px] text-[var(--text-ghost)]">{taskCount}</span>
      )}

      <span className="ml-auto flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        <motion.button
          onClick={() => onEdit(section)}
          aria-label="Edit section"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M8.5 1.5l2 2L4 10H2V8l6.5-6.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button
          onClick={() => onDelete(section.id)}
          aria-label="Delete section"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="flex min-h-11 min-w-11 items-center justify-center text-[var(--text-ghost)] hover:text-[var(--text-secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M2 3h8M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M3 3v7a1 1 0 001 1h4a1 1 0 001-1V3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </span>
    </div>
  )
}
