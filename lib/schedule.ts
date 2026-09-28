/**
 * Scansione oraria ISISS "Antonio Magarotto" (Roma), a.s. 2026/27.
 * Unica fonte di verità per orari delle ore, intervallo e dati scuola.
 */

export const SCHOOL_NAME = 'ISISS "Antonio Magarotto"'
export const SCHOOL_SHORT = 'ISISS Magarotto'
export const SCHOOL_CITY = 'Roma'

/** Anno scolastico 2026/27 — intervallo mostrato dal calendario */
export const CALENDAR_FROM = '2026-09-14'
export const CALENDAR_TO = '2027-06-30'
/** Ultimo giorno di lezione (calendario scolastico 2026/27, sedi di Roma) */
export const LESSONS_END = '2027-06-08'
export const LESSONS_END_LABEL = '8 giu 2027'

export type Scansione = {
  /** Orario nominale di inizio di ogni ora (HH:MM) */
  start: Record<number, string>
  /** Orario nominale di fine di ogni ora (HH:MM) */
  end: Record<number, string>
  /** Inizio effettivo della lezione, quando diverso da quello nominale (dopo l'intervallo) */
  effectiveStart: Record<number, string>
  /** Intervalli: chiave = ora DOPO la quale cade la pausa */
  breaks: Record<number, string>
}

/** Scansione standard. La 3ª ora parte dopo l'intervallo (10:00–10:20). */
const SCANSIONE_BASE: Scansione = {
  start: { 1: '08:10', 2: '09:10', 3: '10:10', 4: '11:10', 5: '12:10', 6: '13:10', 7: '14:10' },
  end:   { 1: '09:10', 2: '10:10', 3: '11:10', 4: '12:10', 5: '13:10', 6: '14:10', 7: '15:10' },
  effectiveStart: { 1: '08:10', 2: '09:10', 3: '10:20', 4: '11:10', 5: '12:10', 6: '13:10', 7: '14:10' },
  breaks: { 2: '10:00–10:20' },
}

/**
 * Scansioni ridotte per periodi specifici (inizio anno: 5 ore, poi 6, poi 7).
 * Nuova scansione = aggiungere una voce con from/to (inclusivi, yyyy-MM-dd).
 */
const SCANSIONI_PERIODO: Array<{ from: string; to: string; scan: Scansione }> = [
  {
    // Settimana 28 set – 2 ott 2026: 5 ore, ricreazione 10:50–11:10
    from: '2026-09-28',
    to: '2026-10-02',
    scan: {
      start: { 1: '08:10', 2: '09:10', 3: '10:00', 4: '11:00', 5: '12:00' },
      end:   { 1: '09:10', 2: '10:00', 3: '11:00', 4: '12:00', 5: '12:50' },
      effectiveStart: { 1: '08:10', 2: '09:10', 3: '10:00', 4: '11:10', 5: '12:00' },
      breaks: { 3: '10:50–11:10' },
    },
  },
]

/** Scansione oraria in vigore nel giorno indicato (yyyy-MM-dd) */
export function scansione(date: string): Scansione {
  return SCANSIONI_PERIODO.find(p => date >= p.from && date <= p.to)?.scan ?? SCANSIONE_BASE
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
