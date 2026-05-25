import { db } from '@/lib/db'
import { useErrorStore } from '@/stores/errorStore'

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToJSON() {
  try {
    const [tasks, flowSections, driftEntries, reflections, categories, settings] = await Promise.all([
      db.tasks.toArray(),
      db.flowSections.toArray(),
      db.driftEntries.toArray(),
      db.reflections.toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      tasks,
      flowSections,
      driftEntries,
      reflections,
      categories,
      settings,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    download(`flow-export-${new Date().toISOString().slice(0, 10)}.json`, blob)
  } catch {
    useErrorStore.getState().push('unknown', {
      message: 'Export couldn\'t finish right now',
      description: 'Nothing was lost. You can try again.',
    })
  }
}

export async function exportToCSV() {
  try {
    const tasks = await db.tasks.toArray()

    const headers = [
      'id',
      'title',
      'status',
      'date',
      'sortOrder',
      'estimatedMinutes',
      'frictionLevel',
      'flowSectionId',
      'categoryId',
      'createdAt',
      'completedAt',
      'isRecurring',
      'recurrenceType',
    ]

    const rows = tasks.map((t) => {
      const record = t as unknown as Record<string, unknown>
      return headers
        .map((h) => {
          const val = record[h]
          if (val === null || val === undefined) return ''
          const str = String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    download(`flow-tasks-${new Date().toISOString().slice(0, 10)}.csv`, blob)
  } catch {
    useErrorStore.getState().push('unknown', {
      message: 'Export couldn\'t finish right now',
      description: 'Nothing was lost. You can try again.',
    })
  }
}
