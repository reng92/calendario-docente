import 'dotenv/config'
import { db } from '../db'
import { classes, coteachers, weeklySlots } from '../db/schema'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * Orario in vigore dal 26 ottobre 2026, senza rilanciare il seed (che farebbe
 * TRUNCATE anche di meetings): chiude al 25/10 slot e compresenze dell'orario
 * del 19/10 e inserisce quelli nuovi. Stessi dati di `orario26ott`/`cot26ott`
 * in scripts/seed.ts.
 */
const FROM = '2026-10-26'
const PREV_FROM = '2026-10-19'
const PREV_TO = '2026-10-25'

type SlotRow = [wd: number, hour: number, code: string, subject?: string, room?: string]
type CotRow = [wd: number, hour: number, code: string, name: string]

const orario: SlotRow[] = [
  [0, 2, '3MAN', 'TTIM', 'T.37A-LabElImp'],
  [0, 3, '3MAN', 'TTIM', 'T.37A-LabElImp'],
  [0, 4, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [0, 5, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [0, 6, 'D'],
  [1, 4, 'D'],
  [1, 5, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [1, 6, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [2, 4, '3MAN', 'TTIM', 'T.37B-LabEIPC'],
  [2, 5, '3MAN', 'TTIM', 'T.37B-LabEIPC'],
  [2, 6, '4MAN', 'TTRI', 'T.37B-LabEIPC'],
  [2, 7, '4MAN', 'TTRI', 'T.37B-LabEIPC'],
  [3, 3, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [3, 4, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [3, 5, '2MAN', 'FIS',  'T.15'],
  [3, 6, '2MAN', 'FIS',  'T.15'],
  [4, 3, '3MAN', 'TTRI', 'T.37B-LabEIPC'],
  [4, 4, '3MAN', 'TTRI', 'T.37B-LabEIPC'],
  [4, 5, '4IAN', 'TGPP', 'T.33-Lab-GrSt'],
  [4, 6, '4IAN', 'TGPP', 'T.33-Lab-GrSt'],
]

const cot: CotRow[] = [
  [0, 2, '3MAN', 'Valente'], [0, 3, '3MAN', 'Valente'], [0, 4, '1MAN', 'Nencetti'], [0, 5, '3MAN', 'Lavoro'],
  [1, 5, '1MAN', 'Nencetti'], [1, 6, '1MAN', 'Nencetti'],
  [2, 4, '3MAN', 'Valente'], [2, 5, '3MAN', 'Valente'], [2, 6, '4MAN', 'Lavoro'], [2, 7, '4MAN', 'Lavoro'],
  [3, 3, '3MAN', 'Lavoro'], [3, 4, '3MAN', 'Lavoro'], [3, 5, '2MAN', 'Micciché'], [3, 6, '2MAN', 'Micciché'],
  [4, 3, '3MAN', 'Lavoro'], [4, 4, '3MAN', 'Lavoro'], [4, 5, '4IAN', 'Marinelli'], [4, 6, '4IAN', 'Marinelli'],
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
