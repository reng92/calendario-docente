import 'dotenv/config'
import { db } from '../db'
import { meetings } from '../db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

/**
 * Turni di sorveglianza durante la ricreazione (10:50–11:10), settimana
 * 3–6 novembre 2026 (area interna + area esterna). Mercoledì 4 nessun turno.
 * Non rientrano nelle 40+40 ore.
 */
const FROM = '2026-11-02'
const TO = '2026-11-06'

const turni = [
  { date: '2026-11-03', title: 'Area macchinette', notes: 'Area A interna: area macchinette' },
  { date: '2026-11-05', title: 'Antistante aula magna', notes: 'Area G esterna: area antistante aula magna' },
  { date: '2026-11-06', title: 'Corridoio p.t. · ingresso', notes: 'Area B interna: corridoio piano terra antistante ingresso principale' },
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
