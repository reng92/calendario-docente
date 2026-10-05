/**
 * Conteggio delle 40+40 ore di attività funzionali all'insegnamento
 * (CCNL scuola, art. 29 c. 3):
 * - lett. a: collegio docenti, programmazione/verifica (dipartimenti),
 *   informazione alle famiglie — fino a 40 ore annue
 * - lett. b: consigli di classe — fino a 40 ore annue
 * Scrutini ed esami (lett. c) non rientrano nel tetto e non si contano.
 */

export const LIMITE_ORE = 40

export type Comma = 'a' | 'b'

const COMMA_BY_KIND: Record<string, Comma> = {
  collegio: 'a',
  dipartimento: 'a',
  colloqui: 'a',
  cdc: 'b',
}

export function commaOf(kind: string): Comma | null {
  return COMMA_BY_KIND[kind] ?? null
}

/** Inizio e fine (inclusi) dell'anno scolastico che contiene la data: 1/9 – 31/8 */
export function annoScolastico(iso: string): { from: string; to: string; label: string } {
  const y = parseInt(iso.slice(0, 4), 10)
  const start = parseInt(iso.slice(5, 7), 10) >= 9 ? y : y - 1
  return { from: `${start}-09-01`, to: `${start + 1}-08-31`, label: `${start}/${String(start + 1).slice(2)}` }
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Durata in minuti; 0 se manca un orario */
export function durataMin(startTime: string | null, endTime: string | null): number {
  if (!startTime || !endTime) return 0
  return Math.max(0, toMin(endTime) - toMin(startTime))
}

export type Monte = { svolti: number; programmati: number; senzaOrario: number }

/** Minuti svolti (impegno terminato) e programmati per comma, nell'anno scolastico di `now.date` */
export function monteOre(
  rows: Array<{ date: string; startTime: string | null; endTime: string | null; kind: string }>,
  now: { date: string; minutes: number },
): Record<Comma, Monte> {
  const as = annoScolastico(now.date)
  const out: Record<Comma, Monte> = {
    a: { svolti: 0, programmati: 0, senzaOrario: 0 },
    b: { svolti: 0, programmati: 0, senzaOrario: 0 },
  }
  for (const r of rows) {
    const c = commaOf(r.kind)
    if (!c || r.date < as.from || r.date > as.to) continue
    const min = durataMin(r.startTime, r.endTime)
    if (min === 0) { out[c].senzaOrario++; continue }
    const done = r.date < now.date || (r.date === now.date && toMin(r.endTime!) <= now.minutes)
    if (done) out[c].svolti += min
    else out[c].programmati += min
  }
  return out
}

/** 75 → "1 h 15′" */
export function formatOre(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}′`
  return m === 0 ? `${h} h` : `${h} h ${m}′`
}
