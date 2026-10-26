import { capFirst } from '@/components/utils'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronDown } from 'lucide-react'
import { LIMITE_ORE, formatOre, type Comma, type Previsione as P } from '@/lib/impegni'

const COMMI: Array<{ key: Comma; label: string }> = [
  { key: 'a', label: 'Collegio e programmazione' },
  { key: 'b', label: 'Consigli di classe' },
]

const giorno = (iso: string) => format(parseISO(iso), 'EEE d MMM', { locale: it })

/** Quando si esauriscono le 40+40 ore, secondo impegni registrati e planning d'istituto */
export function Previsione({ data }: { data: Record<Comma, P> }) {
  const limit = LIMITE_ORE * 60
  return (
    <section>
      <h2 className="px-1 pb-2 text-caption text-muted">Previsione · quando finiscono le 40+40 ore</h2>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {COMMI.map(({ key, label }) => {
          const p = data[key]
          return (
            <div key={key} className="px-4 py-3">
              <p className="text-body font-semibold text-ink">{label}</p>
              {p.limiteIl ? (
                <p className="text-body text-warn">
                  Arrivi a {LIMITE_ORE} h {giorno(p.limiteIl)}
                  {p.totale > limit && ` · a fine anno ${formatOre(p.totale - limit)} oltre il limite`}
                </p>
              ) : (
                <p className="text-body text-ink">
                  Non arrivi a {LIMITE_ORE} h: a fine anno <span className="tabular font-semibold">{formatOre(p.totale)}</span>
                  <span className="text-muted"> · margine {formatOre(limit - p.totale)}</span>
                </p>
              )}
              <p className="text-small text-muted">
                {p.ultimo ? `Ultimo impegno previsto: ${giorno(p.ultimo)}` : 'Nessun altro impegno previsto'}
              </p>
              {p.tappe.length > 0 && (
                <details className="group mt-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-small font-semibold text-accent [&::-webkit-details-marker]:hidden">
                    {p.tappe.length} impegni da qui a fine anno
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <ol className="space-y-1.5 pb-1">
                    {p.tappe.map(t => (
                      <li key={`${t.date}-${t.title}`} className="flex items-baseline gap-3 text-small">
                        <span className="w-20 shrink-0 text-muted">{capFirst(giorno(t.date))}</span>
                        <span className="min-w-0 flex-1 truncate text-ink">
                          {t.title}
                          <span className="text-muted"> · {t.stima ? '~' : ''}{formatOre(t.min)}</span>
                        </span>
                        <span className={t.cum > limit ? 'shrink-0 tabular text-warn' : 'shrink-0 tabular text-muted'}>
                          {formatOre(t.cum)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )
        })}
      </div>
      <p className="px-1 pt-2 text-small text-muted">
        Stime dal planning annuale d’istituto (~): per i consigli conto circa 1 h a classe. Quando registri l’impegno vero, vale quello.
      </p>
    </section>
  )
}
