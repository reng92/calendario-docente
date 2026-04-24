import { db } from '@/db'
import { meetings } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { MeetingForm } from './MeetingForm'
import { DeleteButton } from '../DeleteButton'
import { deleteMeeting } from '../actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const KIND_LABELS: Record<string, string> = {
  collegio: 'Collegio docenti',
  cdc: 'Consiglio di classe',
  dipartimento: 'Dipartimento',
  colloqui: 'Colloqui',
  scrutini: 'Scrutini',
}

export default async function MeetingsPage() {
  const rows = await db.select().from(meetings).orderBy(desc(meetings.date))

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Impegni pomeridiani</h1>
        <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ← Admin
        </Link>
      </header>
      <div className="p-3 space-y-4">
        <section className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuovo impegno</h2>
          <MeetingForm />
        </section>
        <section className="space-y-2">
          {rows.map(m => (
            <div key={m.id} className="bg-white border border-stone-200 rounded-2xl p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-500">{m.date} {m.startTime && `· ${m.startTime.slice(0, 5)}`}</div>
                <div className="font-bold">{m.title}</div>
                <div className="text-xs text-stone-500">{KIND_LABELS[m.kind] ?? m.kind}</div>
                {m.notes && <div className="text-xs text-amber-700 mt-1">⚠️ {m.notes}</div>}
              </div>
              <DeleteButton id={m.id} action={deleteMeeting} />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
