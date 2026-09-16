'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMeeting, updateMeeting } from '../actions'

const KIND_LABELS: Record<string, string> = {
  collegio: 'Collegio docenti',
  cdc: 'Consiglio di classe',
  dipartimento: 'Dipartimento',
  colloqui: 'Colloqui',
  scrutini: 'Scrutini',
}

type Meeting = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  kind: string
  title: string
  notes: string | null
}

const inputCls = 'w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm'
const selectCls = 'w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm'

export function MeetingRow({ m }: { m: Meeting }) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSave(formData: FormData) {
    setPending(true)
    await updateMeeting(m.id, {
      date: formData.get('date') as string,
      startTime: (formData.get('startTime') as string) || undefined,
      endTime: (formData.get('endTime') as string) || undefined,
      kind: formData.get('kind') as string,
      title: formData.get('title') as string,
      notes: (formData.get('notes') as string) || undefined,
    })
    setPending(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Eliminare questo impegno?')) return
    await deleteMeeting(m.id)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-2xl p-3">
        <form action={handleSave} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="date" type="date" defaultValue={m.date} required className={inputCls} />
            <select name="kind" defaultValue={m.kind} required className={selectCls}>
              <option value="collegio">Collegio docenti</option>
              <option value="cdc">Consiglio di classe</option>
              <option value="dipartimento">Dipartimento</option>
              <option value="colloqui">Colloqui</option>
              <option value="scrutini">Scrutini</option>
            </select>
          </div>
          <input name="title" defaultValue={m.title} required placeholder="Titolo" className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-stone-500 font-medium">Inizio</label>
              <input
                name="startTime"
                type="time"
                defaultValue={m.startTime?.slice(0, 5) ?? ''}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-stone-500 font-medium">Fine</label>
              <input
                name="endTime"
                type="time"
                defaultValue={m.endTime?.slice(0, 5) ?? ''}
                className={inputCls}
              />
            </div>
          </div>
          <textarea
            name="notes"
            defaultValue={m.notes ?? ''}
            placeholder="Note (opzionale)"
            className={inputCls}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-stone-900 text-white py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-stone-500 dark:text-stone-400">
          {m.date}
          {m.startTime && ` · dalle ${m.startTime.slice(0, 5)}`}
          {m.endTime && ` alle ${m.endTime.slice(0, 5)}`}
        </div>
        <div className="font-bold">{m.title}</div>
        <div className="text-xs text-stone-500 dark:text-stone-400">{KIND_LABELS[m.kind] ?? m.kind}</div>
        {m.notes && <div className="text-xs text-amber-700 mt-1">⚠️ {m.notes}</div>}
      </div>
      <div className="flex gap-3 shrink-0 pt-0.5">
        <button
          onClick={() => setEditing(true)}
          className="text-stone-600 dark:text-stone-300 text-xs font-semibold hover:underline"
        >
          Modifica
        </button>
        <button
          onClick={handleDelete}
          className="text-red-600 text-xs font-semibold hover:underline"
        >
          Elimina
        </button>
      </div>
    </div>
  )
}
