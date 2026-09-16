import { db } from '@/db'
import { circolariSeen, sources } from '@/db/schema'
import { desc } from 'drizzle-orm'
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

export default async function CircolariPage() {
  const [rows, sourceRows] = await Promise.all([
    db.select().from(circolariSeen).orderBy(desc(circolariSeen.createdAt)),
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
          <Tabs defaultValue={keys[0]}>
            <TabsList className="mb-3 h-11 w-full rounded-control p-1">
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
                  {grouped.get(k)!.map(item => {
                    const when = item.pubblicataIl ?? item.createdAt
                    return (
                      <li key={item.id}>
                        <a
                          href={item.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-14 items-start gap-3 px-4 py-3 hover:bg-surface-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-body font-semibold leading-snug text-ink">{item.titolo}</p>
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
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </main>
  )
}
