import { db } from '@/db'
import { meetings } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { MeetingForm } from './MeetingForm'
import { MeetingRow } from './MeetingRow'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const rows = await db.select().from(meetings).orderBy(asc(meetings.date))

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
            <MeetingRow key={m.id} m={m} />
          ))}
        </section>
      </div>
    </main>
  )
}
