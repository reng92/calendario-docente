import { db } from '@/db'
import { meetings } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { AppHeader } from '@/components/AppHeader'
import { FormSheet } from '@/components/FormSheet'
import { getRomeNow } from '@/components/now'
import { MeetingForm } from './MeetingForm'
import { MeetingRow } from './MeetingRow'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const now = getRomeNow()
  const rows = await db.select().from(meetings).orderBy(asc(meetings.date), asc(meetings.startTime))
  const upcoming = rows.filter(r => r.date >= now.date)
  const past = rows.filter(r => r.date < now.date).reverse()

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader
        title="Impegni pomeridiani"
        back="/altro"
        action={
          <FormSheet title="Nuovo impegno" triggerLabel="Aggiungi">
            <MeetingForm />
          </FormSheet>
        }
      />
      <div className="space-y-5 p-4">
        {rows.length === 0 && (
          <div className="rounded-card border border-line bg-surface px-4 py-8 text-center">
            <p className="text-heading text-ink">Nessun impegno registrato</p>
            <p className="mt-1 text-small text-muted">Aggiungi collegi, consigli di classe, scrutini e colloqui: compaiono nel calendario e in Oggi.</p>
          </div>
        )}
        {upcoming.length > 0 && (
          <section>
            <h2 className="px-1 pb-2 text-caption text-muted">In programma</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {upcoming.map(m => <MeetingRow key={m.id} m={m} />)}
            </ul>
          </section>
        )}
        {past.length > 0 && (
          <section>
            <h2 className="px-1 pb-2 text-caption text-muted">Passati</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {past.map(m => <MeetingRow key={m.id} m={m} past />)}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
