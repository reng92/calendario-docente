import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronDown } from 'lucide-react'
import { capFirst } from '@/components/utils'
import { LIMITE_ORE, formatOre, type Comma, type Monte } from '@/lib/impegni'

const COMMI: Array<{ key: Comma; label: string; hint: string }> = [
  { key: 'a', label: 'Collegio e programmazione', hint: 'Collegi, dipartimenti, famiglie' },
  { key: 'b', label: 'Consigli di classe', hint: 'Consigli di classe, GLO' },
]

const giorno = (iso: string) => format(parseISO(iso), 'EEE d MMM', { locale: it })

export function MonteOre({ data, anno }: { data: Record<Comma, Monte>; anno: string }) {
  const limit = LIMITE_ORE * 60
  return (
    <section>
      <h2 className="px-1 pb-2 text-caption text-muted">Monte ore 40+40 · a.s. {anno}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {COMMI.map(({ key, label, hint }) => {
          const m = data[key]
          const tot = m.svolti + m.programmati
          const over = tot > limit
          const pct = (v: number) => `${Math.min(100, (v / limit) * 100)}%`
          return (
            <div key={key} className="space-y-2 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body font-semibold text-ink">{label}</p>
                  <p className="truncate text-small text-muted">{hint}</p>
                </div>
                <p className="shrink-0 text-body tabular text-ink">
                  <span className="font-semibold">{formatOre(m.svolti)}</span>
                  <span className="text-muted"> / {LIMITE_ORE} h</span>
                </p>
              </div>
              <div
                className="flex h-2 overflow-hidden rounded-full bg-line"
                role="img"
                aria-label={`${formatOre(m.svolti)} svolte e ${formatOre(m.programmati)} programmate su ${LIMITE_ORE} ore`}
              >
                <div className="h-full bg-accent" style={{ width: pct(m.svolti) }} />
                <div className="h-full bg-accent/35" style={{ width: pct(Math.max(0, Math.min(tot, limit) - m.svolti)) }} />
              </div>
              <p className={over ? 'text-small text-warn' : 'text-small text-muted'}>
                {m.programmati > 0 ? `+ ${formatOre(m.programmati)} in programma` : 'Nessun impegno in programma'}
                {` · restano ${formatOre(Math.max(0, limit - tot))}`}
                {over && ` · oltre il limite di ${formatOre(tot - limit)}`}
                {m.senzaOrario > 0 && ` · ${m.senzaOrario} senza orario, non contati`}
                {m.assenze > 0 && ` · ${m.assenze} ${m.assenze === 1 ? 'assenza esclusa' : 'assenze escluse'}`}
              </p>
              {m.voci.length > 0 && (
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-small font-semibold text-accent [&::-webkit-details-marker]:hidden">
                    Come si arriva a {formatOre(m.svolti)}
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <ol className="space-y-1.5 pb-1">
                    {m.voci.map((v, i) => (
                      <li key={`${v.date}-${v.title}-${i}`} className="flex items-baseline gap-3 text-small">
                        <span className="w-20 shrink-0 text-muted">{capFirst(giorno(v.date))}</span>
                        <span className={v.escluso ? 'min-w-0 flex-1 truncate text-muted' : 'min-w-0 flex-1 truncate text-ink'}>
                          {v.title}
                        </span>
                        {v.escluso ? (
                          <span className="shrink-0 text-muted">{v.escluso}</span>
                        ) : (
                          <span className="shrink-0 tabular text-muted">
                            +{formatOre(v.min)} = <span className="font-semibold text-ink">{formatOre(v.cum)}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )
        })}
      </div>
      <p className="px-1 pt-2 text-small text-muted">Se non hai partecipato a un impegno, segnalo come assente: esce dal conteggio. Con la matita correggi l’orario effettivo.</p>
    </section>
  )
}
