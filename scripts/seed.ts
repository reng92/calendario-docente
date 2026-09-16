import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots, coteachers, holidays } from '../db/schema'
import { sql } from 'drizzle-orm'

/**
 * Seed a.s. 2026/27 — ISISS "Antonio Magarotto" (Roma)
 * Orario provvisorio in vigore dal 14 settembre 2026.
 *
 * Legenda orario:
 *   D = "Propria classe" (ora in propria classe, senza compresenza)
 *   1MAN / 3MAN = classi con materia, aula ed eventuale docente di compresenza
 */

const VALID_FROM = '2026-09-14'

async function seed() {
  console.log('🧹 Pulizia tabelle...')
  await db.execute(sql`TRUNCATE meetings, day_overrides, holidays, coteachers, weekly_slots, classes RESTART IDENTITY CASCADE`)

  console.log('📚 Classi...')
  const classData = [
    { code: '1MAN', color: '#0097A7', subject: 'TTRG', room: 'T.09',  floor: null },
    { code: '3MAN', color: '#C62828', subject: 'TTRI', room: 'II.26', floor: null },
    { code: 'D',    color: '#B08900', subject: 'Propria classe', room: null, floor: null },
  ]
  const insertedClasses = await db.insert(classes).values(classData).returning()
  const byCode = Object.fromEntries(insertedClasses.map(c => [c.code, c.id]))

  console.log('📅 Orario settimanale...')
  // [weekday (0=lun), ora, classe, materia?, aula?]
  const schedule: Array<[number, number, string, string?, string?]> = [
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
  await db.insert(weeklySlots).values(
    schedule.map(([wd, h, code, subject, room]) => ({
      weekday: wd, hour: h, classId: byCode[code],
      subject: subject ?? null, room: room ?? null,
      validFrom: VALID_FROM,
    }))
  )

  console.log('👥 Compresenze...')
  const coteacherData = [
    { code: '1MAN', wd: 2, h: 1, name: 'Nencetti', role: 'altro' },
    { code: '3MAN', wd: 2, h: 2, name: 'Lavoro',   role: 'altro' },
    { code: '1MAN', wd: 4, h: 3, name: 'Nencetti', role: 'altro' },
    { code: '3MAN', wd: 4, h: 4, name: 'Valente',  role: 'altro' },
  ]
  await db.insert(coteachers).values(
    coteacherData.map(c => ({
      classId: byCode[c.code], weekday: c.wd, hour: c.h, teacherName: c.name, role: c.role,
    }))
  )

  console.log('🚫 Festività e sospensioni (a.s. 2026/27 — verificare con il calendario d\'istituto)...')
  await db.insert(holidays).values([
    { date: '2026-11-01', label: 'Festa di Ognissanti' },
    { date: '2026-11-02', label: 'Commemorazione dei defunti' },
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
