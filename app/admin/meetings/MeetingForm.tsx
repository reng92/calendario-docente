'use client'

import { useRef, useState } from 'react'
import { createMeeting } from '../actions'

export function MeetingForm() {
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(formData: FormData) {
    setPending(true)
    await createMeeting({
      date: formData.get('date') as string,
      startTime: (formData.get('startTime') as string) || undefined,
      endTime: (formData.get('endTime') as string) || undefined,
      kind: formData.get('kind') as string,
      title: formData.get('title') as string,
      notes: (formData.get('notes') as string) || undefined,
    })
    setPending(false)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <select name="kind" required className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
          <option value="">Tipo...</option>
          <option value="collegio">Collegio docenti</option>
          <option value="cdc">Consiglio di classe</option>
          <option value="dipartimento">Dipartimento</option>
          <option value="colloqui">Colloqui</option>
          <option value="scrutini">Scrutini</option>
        </select>
      </div>
      <input name="title" required placeholder="Titolo" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-stone-500 font-medium">Inizio</label>
          <input name="startTime" type="time" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-stone-500 font-medium">Fine</label>
          <input name="endTime" type="time" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <textarea name="notes" placeholder="Note (opzionale)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" rows={2} />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-stone-900 text-white py-2 font-semibold disabled:opacity-50">
        {pending ? 'Salvataggio...' : 'Aggiungi'}
      </button>
    </form>
  )
}
