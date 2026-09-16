'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOverride } from '../actions'
import { Field, inputCls, selectCls, textareaCls, PrimaryButton } from '@/components/form'
import { OVERRIDE_KIND_OPTIONS } from '@/components/tokens'
import { useFormSheetClose } from '@/components/FormSheet'

type ClassOption = { id: string; code: string }

export function OverrideForm({ classes }: { classes: ClassOption[] }) {
  const [pending, setPending] = useState(false)
  const onDone = useFormSheetClose()
  const [kind, setKind] = useState('')
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setPending(true)
    const hourRaw = formData.get('hour') as string
    try {
      await createOverride({
        date: formData.get('date') as string,
        hour: hourRaw ? parseInt(hourRaw) : undefined,
        kind: formData.get('kind') as string,
        classId: (formData.get('classId') as string) || undefined,
        note: (formData.get('note') as string) || undefined,
      })
      router.refresh()
      onDone()
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="o-date">
          <input id="o-date" name="date" type="date" required className={inputCls} />
        </Field>
        <Field label="Ora" htmlFor="o-hour" hint="1–5; vuoto = tutto il giorno">
          <input id="o-hour" name="hour" type="number" inputMode="numeric" min={1} max={5} placeholder="—" className={inputCls} />
        </Field>
      </div>
      <Field label="Tipo" htmlFor="o-kind">
        <select id="o-kind" name="kind" required value={kind} onChange={e => setKind(e.target.value)} className={selectCls}>
          <option value="" disabled>Scegli…</option>
          {OVERRIDE_KIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Classe" htmlFor="o-class" hint={kind === 'cover' ? 'Obbligatoria per una supplenza.' : 'Facoltativa: limita la modifica a una sola classe.'}>
        <select id="o-class" name="classId" required={kind === 'cover'} defaultValue="" className={selectCls}>
          <option value="">Tutte</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
      </Field>
      <Field label="Note" htmlFor="o-note">
        <textarea id="o-note" name="note" rows={2} placeholder="Es. Assemblea sindacale, prime due ore" className={textareaCls} />
      </Field>
      <PrimaryButton type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Aggiungi modifica'}</PrimaryButton>
    </form>
  )
}
