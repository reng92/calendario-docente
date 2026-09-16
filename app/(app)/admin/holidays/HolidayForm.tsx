'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHoliday } from '../actions'
import { Field, inputCls, PrimaryButton } from '@/components/form'
import { useFormSheetClose } from '@/components/FormSheet'

export function HolidayForm() {
  const [pending, setPending] = useState(false)
  const onDone = useFormSheetClose()
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setPending(true)
    try {
      await createHoliday(formData.get('date') as string, formData.get('label') as string)
      router.refresh()
      onDone()
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Data" htmlFor="h-date">
        <input id="h-date" name="date" type="date" required className={inputCls} />
      </Field>
      <Field label="Descrizione" htmlFor="h-label">
        <input id="h-label" name="label" required placeholder="Es. Vacanze di Pasqua" className={inputCls} />
      </Field>
      <PrimaryButton type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Aggiungi festività'}</PrimaryButton>
    </form>
  )
}
