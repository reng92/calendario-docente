import 'dotenv/config'
import { db } from '../db'
import { classes, coteachers, weeklySlots } from '../db/schema'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * Orario in vigore dal 19 ottobre 2026, senza rilanciare il seed (che farebbe
 * TRUNCATE anche di meetings): chiude al 18/10 slot e compresenze dell'orario
 * del 5/10 e inserisce quelli nuovi. Stessi dati di `orario19ott`/`cot19ott`
 * in scripts/seed.ts.
 */
const FROM = '2026-10-19'
const PREV_FROM = '2026-10-05'
const PREV_TO = '2026-10-18'
const LAB = 'T.37-LabEIPC'

type SlotRow = [wd: number, hour: number, code: string, subject?: string, room?: string]
type CotRow = [wd: number, hour: number, code: string, name: string]

const orario: SlotRow[] = [
  [0, 2, '3MAN', 'TTIM', 'II.26'],
  [0, 3, '4MAN', 'TTRI', LAB],
  [0, 4, 'D'],
  [0, 5, '3MAN', 'TTRI', 'II.26'],
  [0, 6, 'D'],
  [1, 1, '4MAN', 'TTRI', LAB],
  [1, 2, '4MAN', 'TTRI', LAB],
  [2, 1, '3MAN', 'TTIM', LAB],
  [2, 2, '3MAN', 'TTIM', LAB],
  [2, 3, '3MAN', 'TEEA', LAB],
  [2, 4, '3MAN', 'TEEA', LAB],
  [2, 6, 'D'],
  [3, 2, '2MAN', 'FIS',  'T.15'],
  [3, 3, 'D'],
  [4, 2, 'D'],
  [4, 3, '1MAN', 'D',    'II.23'],
  [4, 4, '4IAN', 'TGPP', 'II.24'],
  [4, 5, '3MAN', 'TEEA', 'II.26'],
  [4, 6, '3MAN', 'D',    'II.26'],
]

const cot: CotRow[] = [
  [0, 2, '3MAN', 'Valente'], [0, 3, '4MAN', 'Lavoro'], [0, 5, '3MAN', 'Lavoro'],
  [1, 1, '4MAN', 'Lavoro'], [1, 2, '4MAN', 'Lavoro'],
  [2, 1, '3MAN', 'Valente'], [2, 2, '3MAN', 'Valente'], [2, 3, '3MAN', 'Lavoro'], [2, 4, '3MAN', 'Lavoro'],
  [3, 2, '2MAN', 'Micciché'],
  [4, 5, '3MAN', 'Lavoro'],
]

async function main() {
  const already = await db.select().from(weeklySlots).where(eq(weeklySlots.validFrom, FROM))
  if (already.length) throw new Error(`Orario dal ${FROM} già presente (${already.length} slot)`)

  const byCode = Object.fromEntries((await db.select().from(classes)).map(c => [c.code, c.id]))
  for (const [, , code] of [...orario, ...cot]) if (!byCode[code]) throw new Error(`Classe ${code} non trovata`)

  const closedSlots = await db.update(weeklySlots).set({ validTo: PREV_TO })
    .where(and(eq(weeklySlots.validFrom, PREV_FROM), isNull(weeklySlots.validTo))).returning()
  const closedCot = await db.update(coteachers).set({ validTo: PREV_TO })
    .where(and(eq(coteachers.validFrom, PREV_FROM), isNull(coteachers.validTo))).returning()

  await db.insert(weeklySlots).values(orario.map(([wd, h, code, subject, room]) => ({
    weekday: wd, hour: h, classId: byCode[code],
    subject: subject ?? null, room: room ?? null,
    validFrom: FROM, validTo: null,
  })))
  await db.insert(coteachers).values(cot.map(([wd, h, code, name]) => ({
    classId: byCode[code], weekday: wd, hour: h, teacherName: name, role: 'altro',
    validFrom: FROM, validTo: null,
  })))

  console.log(`✅ Chiusi ${closedSlots.length} slot e ${closedCot.length} compresenze al ${PREV_TO}`)
  console.log(`✅ Inseriti ${orario.length} slot e ${cot.length} compresenze dal ${FROM}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
