import { db } from '@/db'
import { circolariSeen, sources } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AppHeader } from '@/components/AppHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SOURCE_LABELS } from '@/components/tokens'

export const dynamic = 'force-dynamic'

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

/** Voci mostrate per fonte: centinaia di righe nel DOM appesantiscono il telefono */
const PAGE = 30
/** Una circolare è "nuova" se pubblicata negli ultimi 3 giorni */
const NEW_MS = 3 * 24 * 60 * 60 * 1000

export default async function CircolariPage({ searchParams }: { searchParams: Promise<{ tutte?: string; fonte?: string }> }) {
  const sp = await searchParams
  const showAll = sp.tutte === '1'
  const [rows, sourceRows] = await Promise.all([
    // per data di pubblicazione (quella mostrata), non di scoperta: alla prima sync tutte hanno lo stesso createdAt
    db.select().from(circolariSeen).orderBy(desc(sql`coalesce(${circolariSeen.pubblicataIl}, ${circolariSeen.createdAt})`), desc(circolariSeen.id)),
    db.select().from(sources),
  ])

  const labelFor = (key: string) =>
    sourceRows.find(s => s.key === key)?.label ?? SOURCE_LABELS[key] ?? key

  const grouped = new Map<string, typeof rows>()
  for (const r of rows) {
    const list = grouped.get(r.sourceKey) ?? []
    list.push(r)
    grouped.set(r.sourceKey, list)
  }
  // ordine: scuola prima, poi le altre
  const keys = [...grouped.keys()].sort((a, b) => (a === 'scuola' ? -1 : b === 'scuola' ? 1 : a.localeCompare(b)))

  return (
    <main className="mx-auto max-w-xl">
      <AppHeader title="Circolari" subtitle="Le più recenti in alto" />
      <div className="p-4">
        {keys.length === 0 ? (
          <div className="rounded-card border border-line bg-surface px-4 py-8 text-center">
            <p className="text-heading text-ink">Nessuna circolare ancora</p>
            <p className="mt-1 text-small text-muted">
              Le nuove pubblicazioni compaiono qui e arrivano come notifica se le hai attivate in Altro.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={sp.fonte && keys.includes(sp.fonte) ? sp.fonte : keys[0]}>
            <TabsList className="mb-3 w-full rounded-control p-1">
              {keys.map(k => (
                <TabsTrigger key={k} value={k} className="h-full rounded-[8px] text-small">
                  {labelFor(k)}
                  <span className="ml-1 rounded-full bg-surface-2 px-1.5 text-caption font-normal tabular text-muted">
                    {grouped.get(k)!.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {keys.map(k => (
              <TabsContent key={k} value={k}>
                <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                  {grouped.get(k)!.slice(0, showAll ? undefined : PAGE).map(item => {
                    const when = item.pubblicataIl ?? item.createdAt
                    const isNew = !!when && Date.now() - new Date(when).getTime() < NEW_MS
                    return (
                      <li key={item.id}>
                        <a
                          href={item.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-14 items-start gap-3 px-4 py-3 hover:bg-surface-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-body font-semibold leading-snug text-ink">
                              {isNew && (
                                <span className="mr-1.5 inline-block rounded-chip bg-accent-soft px-1.5 align-[2px] text-caption text-accent">Nuova</span>
                              )}
                              {item.titolo}
                            </p>
                            <p className="mt-0.5 text-small text-muted">
                              {when && <span className="tabular">{format(new Date(when), 'd MMMM yyyy', { locale: it })}</span>}
                              {item.url && <span> · {hostOf(item.url)}</span>}
                            </p>
                          </div>
                          <ExternalLink className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
                        </a>
                      </li>
                    )
                  })}
                </ul>
                {!showAll && grouped.get(k)!.length > PAGE && (
                  <Link href={`/circolari?tutte=1&fonte=${k}`} className="mt-2 flex min-h-11 items-center justify-center text-small font-semibold text-accent">
                    Mostra tutte le {grouped.get(k)!.length}
                  </Link>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </main>
  )
}
