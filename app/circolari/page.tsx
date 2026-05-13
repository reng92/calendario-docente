import { db } from '@/db'
import { circolariSeen } from '@/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const SOURCE_LABELS: Record<string, string> = {
  scuola: '🏫 Circolari scuola',
  usp: '📋 USP Roma',
}

export default async function CircolariPage() {
  const rows = await db
    .select()
    .from(circolariSeen)
    .orderBy(desc(circolariSeen.createdAt))

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    const key = r.sourceKey
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <main className="max-w-xl mx-auto pb-24">
      <header className="sticky top-0 bg-stone-900 text-white p-4 z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold">Storico circolari</h1>
        <Link
          href="/"
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          ← Calendario
        </Link>
      </header>

      <div className="p-3 space-y-6">
        {Object.entries(grouped).map(([key, items]) => (
          <section key={key}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">
              {SOURCE_LABELS[key] ?? key} — {items.length} voci
            </h2>
            <div className="space-y-1.5">
              {items.map(item => (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 hover:border-stone-400 dark:hover:border-stone-500 transition"
                >
                  <div className="font-medium text-sm text-stone-800 dark:text-stone-100 leading-snug">
                    {item.titolo}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {item.pubblicataIl && (
                      <span className="text-[11px] text-stone-400 dark:text-stone-500">
                        {format(new Date(item.pubblicataIl), 'd MMM yyyy', { locale: it })}
                      </span>
                    )}
                    {item.notificataIl && (
                      <span className="text-[11px] text-green-700 dark:text-green-400">
                        ✓ notificata
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        {rows.length === 0 && (
          <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-8">
            Nessuna circolare ancora registrata.
          </p>
        )}
      </div>
    </main>
  )
}
