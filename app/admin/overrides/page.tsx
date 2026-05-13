import { db } from '@/db'
import { classes, dayOverrides } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { OverrideForm } from './OverrideForm'
import { DeleteButton } from '../DeleteButton'
import { deleteOverride } from '../actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const KIND_LABELS: Record<string, string> = {
  padel: 'Padel (Racchette in Classe)',
  assembly: 'Assemblea',
  strike: 'Sciopero',
  cover: 'Supplenza',
  custom: 'Altro',
}

export default async function OverridesPage() {
  const [rows, classesData] = await Promise.all([
    db.select().from(dayOverrides).orderBy(desc(dayOverrides.date)),
    db.select().from(classes).orderBy(classes.code),
  ])
  const classById = Object.fromEntries(classesData.map(c => [c.id, c.code]))

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Modifiche giornaliere</h1>
        <Link href="/admin" className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          ← Admin
        </Link>
      </header>
      <div className="p-3 space-y-4">
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
          <h2 className="font-bold mb-3">Nuova modifica</h2>
          <OverrideForm classes={classesData.map(c => ({ id: c.id, code: c.code }))} />
        </section>
        <section className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {r.date}
                  {r.hour != null && ` · ora ${r.hour}`}
                  {r.classId && ` · ${classById[r.classId] ?? ''}`}
                </div>
                <div className="font-bold">{KIND_LABELS[r.kind] ?? r.kind}</div>
                {r.note && <div className="text-xs text-stone-500 mt-0.5">{r.note}</div>}
              </div>
              <DeleteButton id={r.id} action={deleteOverride} />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
