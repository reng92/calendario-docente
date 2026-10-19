import 'dotenv/config'
import { db } from '../db'
import { meetings } from '../db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

/**
 * Turni di sorveglianza durante la ricreazione (10:50–11:10), settimana
 * 19–23 ottobre 2026 (Turni di sorveglianza 19 22 ottobre.docx.pdf).
 * Martedì 20 nessun turno. Non rientrano nelle 40+40 ore.
 */
const FROM = '2026-10-19'
const TO = '2026-10-23'

const INTERNA_A = {
  title: 'Corridoio piano terra · aula docenti',
  notes: 'Area A interna: corridoio piano terra antistante aula docenti (area macchinette)',
}
const turni = [
  { date: '2026-10-19', ...INTERNA_A },
  { date: '2026-10-21', title: 'Area stampa', notes: 'Area A esterna: area stampa' },
  { date: '2026-10-22', ...INTERNA_A },
  { date: '2026-10-23', title: 'Aule palestra', notes: 'Area E esterna: aule palestra' },
]

async function main() {
  const already = await db.select().from(meetings)
    .where(and(eq(meetings.kind, 'sorveglianza'), gte(meetings.date, FROM), lte(meetings.date, TO)))
  if (already.length) throw new Error(`Turni ${FROM}–${TO} già presenti (${already.length})`)

  await db.insert(meetings).values(turni.map(t => ({
    date: t.date, startTime: '10:50', endTime: '11:10',
    kind: 'sorveglianza', title: t.title, location: t.notes, notes: t.notes,
  })))
  console.log(`✅ Inseriti ${turni.length} turni di sorveglianza`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
