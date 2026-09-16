'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting, updateMeeting } from '../actions'
import { Field, inputCls, selectCls, textareaCls, PrimaryButton } from '@/components/form'
import { useFormSheetClose } from '@/components/FormSheet'
import { EVENT_KIND_OPTIONS } from '@/components/tokens'

export type MeetingInput = {
  id?: string
  date?: string
  startTime?: string | null
  endTime?: string | null
  kind?: string
  title?: string
  notes?: string | null
}

export function MeetingForm({ initial }: { initial?: MeetingInput }) {
  const [pending, setPending] = useState(false)
  const onDone = useFormSheetClose()
  const router = useRouter()
  const editing = !!initial?.id

  async function onSubmit(formData: FormData) {
    setPending(true)
    const data = {
      date: formData.get('date') as string,
      startTime: (formData.get('startTime') as string) || undefined,
      endTime: (formData.get('endTime') as string) || undefined,
      kind: formData.get('kind') as string,
      title: formData.get('title') as string,
      notes: (formData.get('notes') as string) || undefined,
    }
    try {
      if (editing) await updateMeeting(initial!.id!, data)
      else await createMeeting(data)
      router.refresh()
      onDone()
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="m-date">
          <input id="m-date" name="date" type="date" required defaultValue={initial?.date ?? ''} className={inputCls} />
        </Field>
        <Field label="Tipo" htmlFor="m-kind">
          <select id="m-kind" name="kind" required defaultValue={initial?.kind ?? ''} className={selectCls}>
            <option value="" disabled>Scegli…</option>
            {EVENT_KIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Titolo" htmlFor="m-title">
        <input id="m-title" name="title" required defaultValue={initial?.title ?? ''} placeholder="Es. Consiglio di classe 3MAN" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Inizio" htmlFor="m-start">
          <input id="m-start" name="startTime" type="time" defaultValue={initial?.startTime?.slice(0, 5) ?? ''} className={inputCls} />
        </Field>
        <Field label="Fine" htmlFor="m-end">
          <input id="m-end" name="endTime" type="time" defaultValue={initial?.endTime?.slice(0, 5) ?? ''} className={inputCls} />
        </Field>
      </div>
      <Field label="Note" htmlFor="m-notes" hint="Facoltative: aula, ordine del giorno, avvertenze.">
        <textarea id="m-notes" name="notes" rows={2} defaultValue={initial?.notes ?? ''} className={textareaCls} />
      </Field>
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi impegno'}
      </PrimaryButton>
    </form>
  )
}
