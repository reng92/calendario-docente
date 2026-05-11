'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHoliday } from '../actions'

export function HolidayForm() {
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setPending(true)
    await createHoliday(
      formData.get('date') as string,
      formData.get('label') as string,
    )
    setPending(false)
    formRef.current?.reset()
    router.refresh()
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <input name="date" type="date" required className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <input name="label" required placeholder="Descrizione (es. Vacanze di Pasqua)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-stone-900 text-white py-2 font-semibold disabled:opacity-50">
        {pending ? 'Salvataggio...' : 'Aggiungi'}
      </button>
    </form>
  )
}
