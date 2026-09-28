import { scansione, timeToMin } from '@/lib/schedule'

export type RomeNow = { date: string; minutes: number }

/** Data (yyyy-MM-dd) e minuto del giorno in fuso Europe/Rome */
export function getRomeNow(d: Date = new Date()): RomeNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  const hour = parseInt(get('hour'), 10) % 24
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + parseInt(get('minute'), 10),
  }
}

export type SlotState = 'past' | 'current' | 'next' | 'future'

/** Stato temporale di un'ora di lezione rispetto a "adesso" */
export function slotState(hour: number, dayDate: string, now: RomeNow | undefined, nextHour?: number): SlotState {
  if (!now) return 'future'
  if (dayDate < now.date) return 'past'
  if (dayDate > now.date) return 'future'
  const scan = scansione(dayDate)
  const start = timeToMin(scan.effectiveStart[hour] ?? scan.start[hour] ?? '00:00')
  const end = timeToMin(scan.end[hour] ?? '00:00')
  if (now.minutes >= end) return 'past'
  if (now.minutes >= start) return 'current'
  if (nextHour === hour) return 'next'
  return 'future'
}

/** Intervallo che cade dopo l'ora indicata, nel giorno indicato, se esiste */
export function breakAfter(hour: number, date: string): { label: string; start: number; end: number } | null {
  const b = scansione(date).breaks[hour]
  if (!b) return null
  const [s, e] = b.split('–')
  return { label: b, start: timeToMin(s), end: timeToMin(e) }
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
