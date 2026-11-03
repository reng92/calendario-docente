import 'dotenv/config'
import { db } from '../db'
import { classes, coteachers, weeklySlots } from '../db/schema'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * Orario in vigore dal 3 novembre 2026 (stessa scansione a 7 ore), senza
 * rilanciare il seed (che farebbe TRUNCATE anche di meetings): chiude al 2/11
 * slot e compresenze dell'orario del 26/10 e inserisce quelli nuovi. Stessi
 * dati di `orario3nov`/`cot3nov` in scripts/seed.ts.
 */
const FROM = '2026-11-03'
const PREV_FROM = '2026-10-26'
const PREV_TO = '2026-11-02'

type SlotRow = [wd: number, hour: number, code: string, subject?: string, room?: string]
type CotRow = [wd: number, hour: number, code: string, name: string]

const orario: SlotRow[] = [
  [0, 4, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [0, 5, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [0, 6, '4MAN', 'TTRI', 'T.37B-LabEIPC'],
  [0, 7, '4MAN', 'TTRI', 'T.37B-LabEIPC'],
  [1, 2, '3MAN', 'TEEA', 'T.28-Lab-El'],
  [1, 3, '2MAN', 'FIS',  'T.15'],
  [1, 4, '2MAN', 'FIS',  'T.15'],
  [1, 5, '4IAN', 'TGPP', 'T.33-Lab-GrSt'],
  [1, 6, '4IAN', 'TGPP', 'T.33-Lab-GrSt'],
  [2, 5, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [2, 6, '3MAN', 'TTRI', 'T.37B-LabEIPC'],
  [2, 7, '3MAN', 'TTRI', 'T.37B-LabEIPC'],
  [3, 2, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [3, 3, '1MAN', 'TTRG', 'S.00-Lab-CV'],
  [3, 4, 'D'],
  [3, 5, '3MAN', 'TTIM', 'T.37B-LabEIPC'],
  [3, 6, '3MAN', 'TTIM', 'T.37B-LabEIPC'],
  [4, 3, '3MAN', 'TTIM', 'T.37A-LabElImp'],
  [4, 4, '3MAN', 'TTIM', 'T.37A-LabElImp'],
  [4, 5, 'D'],
]

const cot: CotRow[] = [
  [0, 4, '3MAN', 'Lavoro'], [0, 5, '3MAN', 'Lavoro'], [0, 6, '4MAN', 'Lavoro'], [0, 7, '4MAN', 'Lavoro'],
  [1, 2, '3MAN', 'Lavoro'], [1, 3, '2MAN', 'Micciché'], [1, 4, '2MAN', 'Micciché'], [1, 5, '4IAN', 'Marinelli'], [1, 6, '4IAN', 'Marinelli'],
  [2, 5, '1MAN', 'Nencetti'], [2, 6, '3MAN', 'Lavoro'], [2, 7, '3MAN', 'Lavoro'],
  [3, 2, '1MAN', 'Nencetti'], [3, 3, '1MAN', 'Nencetti'], [3, 5, '3MAN', 'Valente'], [3, 6, '3MAN', 'Valente'],
  [4, 3, '3MAN', 'Valente'], [4, 4, '3MAN', 'Valente'],
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
