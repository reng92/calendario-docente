import { db } from '@/db'
import { holidays } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { HolidayForm } from './HolidayForm'
import { DeleteButton } from '../DeleteButton'
import { deleteHoliday } from '../actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HolidaysPage() {
  const rows = await db.select().from(holidays).orderBy(asc(holidays.date))

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Festività</h1>
        <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ← Admin
        </Link>
      </header>
      <div className="p-3 space-y-4">
        <section className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuova festività</h2>
          <HolidayForm />
        </section>
        <section className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-white border border-stone-200 rounded-2xl p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-500">{r.date}</div>
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
