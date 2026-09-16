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

/** Orario nominale di inizio di ogni ora (HH:MM) */
export const HOUR_START: Record<number, string> = {
  1: '08:10',
  2: '09:10',
  3: '10:10',
  4: '11:10',
  5: '12:10',
  6: '13:10',
  7: '14:10',
}

/** Orario nominale di fine di ogni ora (HH:MM) */
export const HOUR_END: Record<number, string> = {
  1: '09:10',
  2: '10:10',
  3: '11:10',
  4: '12:10',
  5: '13:10',
  6: '14:10',
  7: '15:10',
}

/**
 * Inizio effettivo della lezione, quando diverso da quello nominale.
 * La 3ª ora parte dopo l'intervallo (10:00–10:20).
 */
export const HOUR_EFFECTIVE_START: Record<number, string> = {
  ...HOUR_START,
  3: '10:20',
}

/** Intervalli: chiave = ora DOPO la quale cade la pausa */
export const BREAKS: Record<number, string> = {
  2: '10:00–10:20',
}

export function hourLabel(hour: number): string {
  return HOUR_START[hour] ?? ''
}

export function hourRange(hour: number): string {
  const s = HOUR_START[hour]
  const e = HOUR_END[hour]
  return s && e ? `${s.replace(/^0/, '')}–${e.replace(/^0/, '')}` : ''
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Minuto (0-1439) in cui termina l'ora indicata */
export function hourEndMin(hour: number): number {
  const e = HOUR_END[hour]
  return e ? timeToMin(e) : 0
}
