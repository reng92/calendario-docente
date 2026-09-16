import { db } from '@/db'
import { meetings } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { MeetingForm } from './MeetingForm'
import { MeetingRow } from './MeetingRow'
import { AppHeader } from '@/components/AppHeader'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const rows = await db.select().from(meetings).orderBy(asc(meetings.date))

  return (
    <main className="max-w-xl mx-auto">
      <AppHeader title="Impegni pomeridiani" back="/admin" />
      <div className="p-3 space-y-4">
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuovo impegno</h2>
          <MeetingForm />
        </section>
        <section className="space-y-2">
          {rows.map(m => (
            <MeetingRow key={m.id} m={m} />
          ))}
        </section>
      </div>
    </main>
  )
}
