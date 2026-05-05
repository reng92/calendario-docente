'use client'

import { useRef, useState } from 'react'
import { createOverride } from '../actions'

type ClassOption = { id: string; code: string }

export function OverrideForm({ classes }: { classes: ClassOption[] }) {
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(formData: FormData) {
    setPending(true)
    const hourRaw = formData.get('hour') as string
    await createOverride({
      date: formData.get('date') as string,
      hour: hourRaw ? parseInt(hourRaw) : undefined,
      kind: formData.get('kind') as string,
      classId: (formData.get('classId') as string) || undefined,
      note: (formData.get('note') as string) || undefined,
    })
    setPending(false)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="hour" type="number" min={1} max={7} placeholder="Ora (1-7)" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </div>
      <select name="kind" required className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="">Tipo...</option>
        <option value="cover">Supplenza</option>
        <option value="assembly">Assemblea</option>
        <option value="strike">Sciopero</option>
        <option value="padel">Padel (Racchette in Classe)</option>
        <option value="custom">Altro</option>
      </select>
      <select name="classId" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="">Classe (opzionale, obbligatoria per supplenza)</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.code}</option>
        ))}
      </select>
      <textarea name="note" placeholder="Note (opzionale)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" rows={2} />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-stone-900 text-white py-2 font-semibold disabled:opacity-50">
        {pending ? 'Salvataggio...' : 'Aggiungi'}
      </button>
    </form>
  )
}
