import { db } from '@/db'
import { holidays } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { HolidayForm } from './HolidayForm'
import { DeleteButton } from '../DeleteButton'
import { deleteHoliday } from '../actions'
import { AppHeader } from '@/components/AppHeader'

export const dynamic = 'force-dynamic'

export default async function HolidaysPage() {
  const rows = await db.select().from(holidays).orderBy(asc(holidays.date))

  return (
    <main className="max-w-xl mx-auto">
      <AppHeader title="Festività" back="/admin" />
      <div className="p-3 space-y-4">
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuova festività</h2>
          <HolidayForm />
        </section>
        <section className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{r.date}</div>
                <div className="font-bold">{r.label}</div>
              </div>
              <DeleteButton id={r.id} action={deleteHoliday} />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
