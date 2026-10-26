import 'dotenv/config'
import { db } from '../db'
import { meetings } from '../db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

/**
 * Turni di sorveglianza durante la ricreazione (10:50–11:10), settimana
 * 26–30 ottobre 2026: tutti i giorni, vicino all'aula/lab della 3ª ora
 * (della 4ª quando alla 3ª non c'è lezione). Non rientrano nelle 40+40 ore.
 */
const FROM = '2026-10-26'
const TO = '2026-10-30'

const turni = [
  { date: '2026-10-26', title: 'T.37A-LabElImp', notes: "Vicino all'aula/lab della 3ª ora" },
  { date: '2026-10-27', title: 'Propria classe', notes: "Vicino all'aula della 4ª ora (ora D)" },
  { date: '2026-10-28', title: 'T.37B-LabEIPC', notes: "Vicino all'aula/lab della 4ª ora" },
  { date: '2026-10-29', title: 'T.28-Lab-El', notes: "Vicino all'aula/lab della 3ª ora" },
  { date: '2026-10-30', title: 'T.37B-LabEIPC', notes: "Vicino all'aula/lab della 3ª ora" },
]

async function main() {
  const already = await db.select().from(meetings)
    .where(and(eq(meetings.kind, 'sorveglianza'), gte(meetings.date, FROM), lte(meetings.date, TO)))
  if (already.length) throw new Error(`Turni ${FROM}–${TO} già presenti (${already.length})`)

  await db.insert(meetings).values(turni.map(t => ({
    date: t.date, startTime: '10:50', endTime: '11:10',
    kind: 'sorveglianza', title: t.title, location: t.title, notes: t.notes,
  })))
  console.log(`✅ Inseriti ${turni.length} turni di sorveglianza`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
