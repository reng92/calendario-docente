import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots, coteachers, holidays } from '../db/schema'
import { sql } from 'drizzle-orm'

/**
 * Seed a.s. 2026/27 — ISISS "Antonio Magarotto" (Roma)
 *
 * Gli slot hanno un periodo di validità (valid_from / valid_to) così il
 * calendario mostra l'orario giusto anche per le settimane passate:
 *   - 14–18 set 2026: orario provvisorio (1MAN, 3MAN, ore "D" = propria classe)
 *   - 21–25 set 2026: orario in vigore dal 21 al 25 settembre (5 classi,
 *     cattedra intera B015, 18 ore, tutte in compresenza)
 *   - dal 28 set 2026: orario della settimana 28 set – 2 ott (5 ore al giorno,
 *     scansione in lib/schedule.ts)
 *
 * Quando arriva un nuovo orario: chiudere gli slot correnti con valid_to,
 * aggiungere i nuovi con valid_from e rilanciare `pnpm db:seed`.
 *
 * Anche le compresenze hanno valid_from / valid_to, stesso periodo del loro
 * orario. Le classi senza co-docente (2MAN, 4IAN) aspettano la nomina del
 * supplente: aggiungere la riga in `coteacherData` quando arriva.
 */

const PROVVISORIO_FROM = '2026-09-14'
const PROVVISORIO_TO = '2026-09-20'
const ORARIO_21_FROM = '2026-09-21'
const ORARIO_21_TO = '2026-09-27'
const ORARIO_28_FROM = '2026-09-28'

type SlotRow = [wd: number, hour: number, code: string, subject?: string, room?: string]
type CotRow = [wd: number, hour: number, code: string, name: string]

async function seed() {
  console.log('🧹 Pulizia tabelle...')
  await db.execute(sql`TRUNCATE meetings, day_overrides, holidays, coteachers, weekly_slots, classes RESTART IDENTITY CASCADE`)

  console.log('📚 Classi...')
  const classData = [
    { code: '1MAN', color: '#0097A7', subject: 'TTRG', room: 'T.09',  floor: null },
    { code: '2MAN', color: '#EF6C00', subject: 'FIS',  room: 'T.15',  floor: null },
    { code: '3MAN', color: '#C62828', subject: 'TTIM', room: 'II.26', floor: null },
    { code: '4MAN', color: '#1565C0', subject: 'TTRI', room: 'II.23', floor: null },
    { code: '4IAN', color: '#5E35B1', subject: 'TGPP', room: 'II.24', floor: null },
    // Solo per l'orario provvisorio del 14–18 settembre
    { code: 'D',    color: '#B08900', subject: 'Propria classe', room: null, floor: null },
  ]
  const insertedClasses = await db.insert(classes).values(classData).returning()
  const byCode = Object.fromEntries(insertedClasses.map(c => [c.code, c.id]))

  console.log('📅 Orario provvisorio 14–18 settembre...')
  // [weekday (0=lun), ora, classe, materia?, aula?]
  const provvisorio: SlotRow[] = [
    // Lunedì
    [0, 1, 'D'], [0, 2, 'D'], [0, 3, 'D'], [0, 4, 'D'],
    // Martedì
    [1, 1, 'D'], [1, 2, 'D'], [1, 3, 'D'], [1, 4, 'D'],
    // Mercoledì
    [2, 1, '1MAN', 'TTRG', 'T.09'],
    [2, 2, '3MAN', 'TTRI', 'Aula Magna'],
    [2, 3, 'D'], [2, 4, 'D'],
    // Giovedì
    [3, 1, 'D'],
    [3, 2, '3MAN', 'TTRI', 'II.26'],
    // Venerdì
    [4, 1, 'D'], [4, 2, 'D'],
    [4, 3, '1MAN', 'TTRG', 'T.09'],
    [4, 4, '3MAN', 'TTIM', 'II.26'],
  ]

  console.log('📅 Orario 21–25 settembre...')
  const orario21: SlotRow[] = [
    // Lunedì
    [0, 1, '2MAN', 'FIS',  'T.15'],
    [0, 2, '4MAN', 'TTRI', 'II.23'],
    [0, 3, '3MAN', 'TEEA', 'II.26'],
    [0, 4, '3MAN', 'TTIM', 'II.26'],
    // Martedì
    [1, 1, '3MAN', 'TEEA', 'II.26'],
    [1, 2, '1MAN', 'TTRG', 'T.09'],
    [1, 3, '4MAN', 'TTRI', 'II.23'],
    // Mercoledì
    [2, 1, '4MAN', 'TTRI', 'II.23'],
    [2, 2, '3MAN', 'TTIM', 'II.26'],
    [2, 3, '1MAN', 'TTRG', 'T.09'],
    [2, 4, '4IAN', 'TGPP', 'II.24'],
    // Giovedì
    [3, 1, '3MAN', 'TTIM', 'II.26'],
    [3, 2, '3MAN', 'TEEA', 'II.26'],
    [3, 3, '2MAN', 'FIS',  'T.15'],
    // Venerdì
    [4, 1, '4IAN', 'TGPP', 'II.24'],
    [4, 2, '3MAN', 'TTRI', 'II.26'],
    [4, 3, '3MAN', 'TTIM', 'II.26'],
    [4, 4, '1MAN', 'TTRG', 'T.09'],
  ]

  console.log('📅 Orario dal 28 settembre...')
  const LAB = 'T.37-LabEIPC'
  const orario28: SlotRow[] = [
    // Lunedì
    [0, 1, '3MAN', 'TTIM', 'II.26'],
    [0, 2, '2MAN', 'FIS',  'T.15'],
    [0, 3, '1MAN', 'TTRG', LAB],
    [0, 4, '1MAN', 'TTRG', LAB],
    [0, 5, '4MAN', 'TTRI', LAB],
    // Martedì
    [1, 3, '3MAN', 'TEEA', LAB],
    [1, 4, '3MAN', 'TEEA', LAB],
    [1, 5, '4IAN', 'TGPP', 'II.24'],
    // Mercoledì
    [2, 2, 'D'],
    [2, 3, '3MAN', 'TTRI', 'II.26'],
    [2, 4, '3MAN', 'TTIM', LAB],
    [2, 5, '3MAN', 'TTIM', LAB],
    // Giovedì
    [3, 4, '1MAN', 'TTRG', 'T.09'],
    [3, 5, '3MAN', 'TEEA', 'II.26'],
    // Venerdì
    [4, 1, '4MAN', 'TTRI', LAB],
    [4, 2, '4MAN', 'TTRI', LAB],
    [4, 3, '3MAN', 'TTIM', 'II.26'],
    [4, 4, '4IAN', 'TGPP', 'II.24'],
    [4, 5, '2MAN', 'FIS',  'T.15'],
  ]

  const toRow = (validFrom: string, validTo: string | null) =>
    ([wd, h, code, subject, room]: SlotRow) => ({
      weekday: wd, hour: h, classId: byCode[code],
      subject: subject ?? null, room: room ?? null,
      validFrom, validTo,
    })
  await db.insert(weeklySlots).values([
    ...provvisorio.map(toRow(PROVVISORIO_FROM, PROVVISORIO_TO)),
    ...orario21.map(toRow(ORARIO_21_FROM, ORARIO_21_TO)),
    ...orario28.map(toRow(ORARIO_28_FROM, null)),
  ])

  console.log('👥 Compresenze...')
  // [weekday, ora, classe, co-docente]
  const cot21: CotRow[] = [
    // Lunedì
    [0, 2, '4MAN', 'Lavoro'], [0, 3, '3MAN', 'Lavoro'], [0, 4, '3MAN', 'Valente'],
    // Martedì
    [1, 1, '3MAN', 'Lavoro'], [1, 2, '1MAN', 'Nencetti'], [1, 3, '4MAN', 'Lavoro'],
    // Mercoledì
    [2, 1, '4MAN', 'Lavoro'], [2, 2, '3MAN', 'Valente'], [2, 3, '1MAN', 'Nencetti'],
    // Giovedì
    [3, 1, '3MAN', 'Valente'], [3, 2, '3MAN', 'Lavoro'],
    // Venerdì
    [4, 2, '3MAN', 'Lavoro'], [4, 3, '3MAN', 'Valente'], [4, 4, '1MAN', 'Nencetti'],
  ]
  const cot28: CotRow[] = [
    // Lunedì
    [0, 1, '3MAN', 'Valente'], [0, 3, '1MAN', 'Nencetti'], [0, 4, '1MAN', 'Nencetti'], [0, 5, '4MAN', 'Lavoro'],
    // Martedì
    [1, 3, '3MAN', 'Lavoro'], [1, 4, '3MAN', 'Lavoro'],
    // Mercoledì
    [2, 3, '3MAN', 'Lavoro'], [2, 4, '3MAN', 'Valente'], [2, 5, '3MAN', 'Valente'],
    // Giovedì
    [3, 4, '1MAN', 'Nencetti'], [3, 5, '3MAN', 'Lavoro'],
    // Venerdì
    [4, 1, '4MAN', 'Lavoro'], [4, 2, '4MAN', 'Lavoro'], [4, 3, '3MAN', 'Valente'],
    // 2MAN (FIS) e 4IAN (TGPP): supplente non ancora nominato
  ]
  const toCot = (validFrom: string, validTo: string | null) =>
    ([wd, h, code, name]: CotRow) => ({
      classId: byCode[code], weekday: wd, hour: h, teacherName: name, role: 'altro',
      validFrom, validTo,
    })
  await db.insert(coteachers).values([
    ...cot21.map(toCot(ORARIO_21_FROM, ORARIO_21_TO)),
    ...cot28.map(toCot(ORARIO_28_FROM, null)),
  ])

  console.log('🚫 Festività e sospensioni (calendario scolastico 2026/27 — sedi di Roma)...')
  await db.insert(holidays).values([
    { date: '2026-11-01', label: 'Festa di Ognissanti' },
    { date: '2026-12-07', label: 'Chiusura deliberata dalla scuola' },
    { date: '2026-12-08', label: 'Immacolata Concezione' },
    { date: '2026-12-23', label: 'Vacanze di Natale' },
    { date: '2026-12-24', label: 'Vacanze di Natale' },
    { date: '2026-12-25', label: 'Natale' },
    { date: '2026-12-26', label: 'Santo Stefano' },
    { date: '2026-12-28', label: 'Vacanze di Natale' },
    { date: '2026-12-29', label: 'Vacanze di Natale' },
    { date: '2026-12-30', label: 'Vacanze di Natale' },
    { date: '2026-12-31', label: 'Vacanze di Natale' },
    { date: '2027-01-01', label: 'Capodanno' },
    { date: '2027-01-04', label: 'Vacanze di Natale' },
    { date: '2027-01-05', label: 'Vacanze di Natale' },
    { date: '2027-01-06', label: 'Epifania' },
    { date: '2027-03-25', label: 'Vacanze di Pasqua' },
    { date: '2027-03-26', label: 'Vacanze di Pasqua' },
    { date: '2027-03-28', label: 'Pasqua' },
    { date: '2027-03-29', label: 'Lunedì dell\'Angelo' },
    { date: '2027-03-30', label: 'Vacanze di Pasqua' },
    { date: '2027-04-25', label: 'Festa della Liberazione' },
    { date: '2027-05-01', label: 'Festa del Lavoro' },
    { date: '2027-06-02', label: 'Festa della Repubblica' },
    { date: '2027-06-29', label: 'Festa del Santo Patrono' },
  ])

  console.log('✅ Seed completato!')
  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Seed fallito:', e)
  process.exit(1)
})
