import { ChevronDown } from 'lucide-react'

/** Promemoria sulle 40+40 ore di attività funzionali (CCNL art. 29 c. 3) */
const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Come sono divise le 80 ore?',
    a: (
      <>
        <p>Le attività funzionali all’insegnamento di carattere collegiale sono due tetti separati, ciascuno fino a 40 ore annue (CCNL scuola, art. 29 c. 3). Le ore non si spostano da un tetto all’altro.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><span className="font-semibold text-ink">Lett. a):</span> collegio e programmazione, fino a 40 h</li>
          <li><span className="font-semibold text-ink">Lett. b):</span> consigli di classe, fino a 40 h</li>
        </ul>
      </>
    ),
  },
  {
    q: 'Cosa conta nelle prime 40 ore (lett. a)?',
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Riunioni del <span className="text-ink">Collegio dei docenti</span></li>
        <li>Programmazione e verifica di inizio e fine anno, compresi i <span className="text-ink">dipartimenti</span> (sono articolazioni del collegio)</li>
        <li><span className="text-ink">Informazione alle famiglie</span> sui risultati degli scrutini e sull’andamento didattico, cioè i colloqui collettivi pomeridiani</li>
      </ul>
    ),
  },
  {
    q: 'Cosa conta nelle seconde 40 ore (lett. b)?',
    a: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>Partecipazione ai <span className="text-ink">consigli di classe</span>, sia ordinari sia straordinari</li>
        </ul>
        <p className="mt-2">Chi ha molte classi può superare le 40 ore: il collegio deve stabilire dei criteri per contenere l’impegno entro il tetto. Le ore oltre il limite non sono dovute, salvo accordo retribuito con il fondo d’istituto (FIS).</p>
      </>
    ),
  },
  {
    q: 'Cosa NON rientra nelle 80 ore?',
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><span className="text-ink">Scrutini ed esami</span> e la compilazione degli atti di valutazione (lett. c): sono obbligatori ma fuori tetto</li>
        <li>Preparazione delle lezioni, correzione degli elaborati, ricevimento individuale dei genitori (attività individuali, c. 2 e c. 4)</li>
        <li>Formazione, progetti, incarichi e funzioni strumentali: sono a parte o retribuiti</li>
      </ul>
    ),
  },
  {
    q: 'Come li conta questa app?',
    a: (
      <>
        <p><span className="text-ink">Collegio, Dipartimento e Colloqui</span> vanno nella lett. a, <span className="text-ink">Consiglio di classe</span> nella lett. b. Gli <span className="text-ink">Scrutini</span> non si contano.</p>
        <p className="mt-2">Un impegno risulta svolto quando ne è passato l’orario di fine. Se è durato più o meno del previsto, correggi l’orario con la matita. Registra come Colloqui solo gli incontri collettivi con le famiglie, non il ricevimento individuale.</p>
        <p className="mt-2">In caso di part-time o di servizio su più scuole, gli obblighi si riproporzionano: verifica con la segreteria.</p>
      </>
    ),
  },
]

export function FaqOre() {
  return (
    <section>
      <h2 className="px-1 pb-2 text-caption text-muted">FAQ · 40+40 ore</h2>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-body font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="px-4 pb-4 text-small text-muted">{a}</div>
          </details>
        ))}
      </div>
    </section>
  )
}
