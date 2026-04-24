import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots, coteachers, holidays, dayOverrides, meetings } from '../db/schema'
import { sql } from 'drizzle-orm'

const VALID_FROM = '2026-01-07'

async function seed() {
  console.log('🧹 Pulizia tabelle...')
  await db.execute(sql`TRUNCATE meetings, day_overrides, holidays, coteachers, weekly_slots, classes RESTART IDENTITY CASCADE`)

  console.log('📚 Classi...')
  const classData = [
    { code: '5CT',  color: '#B5651D', subject: 'TPSEE',          room: '107',  floor: 'Primo' },
    { code: '5ET',  color: '#C0392B', subject: 'TPSEE',          room: '306',  floor: 'Terzo' },
    { code: '4AT',  color: '#27AE60', subject: 'TPSEE',          room: '104b', floor: 'Primo' },
    { code: '3CT',  color: '#7D3C98', subject: 'Elettrotecnica', room: '106',  floor: 'Primo' },
    { code: '3GTB', color: '#16A085', subject: 'Elettrotecnica', room: '205',  floor: 'Secondo' },
    { code: '4CT',  color: '#2874A6', subject: 'TPSEE',          room: '110',  floor: 'Primo' },
    { code: '4DT',  color: '#AD1457', subject: 'TPSEE',          room: '203',  floor: 'Secondo' },
  ]
  const insertedClasses = await db.insert(classes).values(classData).returning()
  const byCode = Object.fromEntries(insertedClasses.map(c => [c.code, c.id]))

  console.log('📅 Orario settimanale...')
  const schedule: Array<[number, number, string]> = [
    [0, 5, '4CT'], [0, 6, '4CT'],
    [1, 2, '5ET'], [1, 3, '5ET'], [1, 4, '3CT'], [1, 5, '3CT'],
    [2, 1, '5CT'], [2, 2, '5CT'], [2, 4, '3GTB'], [2, 5, '3GTB'],
    [3, 5, '4DT'], [3, 6, '4DT'], [3, 7, '4AT'],
    [4, 2, '4AT'], [4, 3, '4AT'], [4, 4, '3GTB'], [4, 5, '5ET'], [4, 6, '5CT'],
  ]
  await db.insert(weeklySlots).values(
    schedule.map(([wd, h, code]) => ({
      weekday: wd, hour: h, classId: byCode[code], validFrom: VALID_FROM,
    }))
  )

  console.log('👥 Compresenze...')
  const coteacherData = [
    { code: '4CT', wd: 0, h: 5, name: 'Caputo Stefano',      role: 'altro' },
    { code: '4CT', wd: 0, h: 5, name: 'Imperatore Stefania', role: 'sostegno' },
    { code: '4CT', wd: 0, h: 6, name: 'Caputo Stefano',      role: 'altro' },
    { code: '5ET', wd: 1, h: 2, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 1, h: 3, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 1, h: 3, name: 'Divenuto Rossella',   role: 'sostegno' },
    { code: '3CT', wd: 1, h: 4, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3CT', wd: 1, h: 4, name: 'Bevacqua Caterina',   role: 'sostegno' },
    { code: '3CT', wd: 1, h: 5, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3CT', wd: 1, h: 5, name: 'Muto Elisabetta',     role: 'sostegno' },
    { code: '5CT', wd: 2, h: 1, name: 'Caputo Stefano',      role: 'altro' },
    { code: '5CT', wd: 2, h: 2, name: 'Caputo Stefano',      role: 'altro' },
    { code: '3GTB',wd: 2, h: 4, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '3GTB',wd: 2, h: 5, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '4DT', wd: 3, h: 5, name: 'Puolo Adriana',       role: 'altro' },
    { code: '4DT', wd: 3, h: 6, name: 'Puolo Adriana',       role: 'altro' },
    { code: '4AT', wd: 3, h: 7, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '4AT', wd: 4, h: 2, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '4AT', wd: 4, h: 3, name: 'De Blasio Giuliano',  role: 'altro' },
    { code: '3GTB',wd: 4, h: 4, name: 'Calzetti Angelo',     role: 'altro' },
    { code: '5ET', wd: 4, h: 5, name: 'Tara Giada',          role: 'altro' },
    { code: '5ET', wd: 4, h: 5, name: 'Divenuto Rossella',   role: 'sostegno' },
    { code: '5CT', wd: 4, h: 6, name: 'Caputo Stefano',      role: 'altro' },
  ]
  await db.insert(coteachers).values(
    coteacherData.map(c => ({
      classId: byCode[c.code], weekday: c.wd, hour: c.h, teacherName: c.name, role: c.role,
    }))
  )

  console.log('🚫 Festività e sospensioni...')
  await db.insert(holidays).values([
    { date: '2025-11-01', label: 'Festa di Ognissanti' },
    { date: '2025-12-08', label: 'Immacolata Concezione' },
    { date: '2025-12-22', label: 'Recupero anticipazione a.s.' },
    { date: '2025-12-23', label: 'Vacanze di Natale' },
    { date: '2025-12-24', label: 'Vacanze di Natale' },
    { date: '2025-12-25', label: 'Natale' },
    { date: '2025-12-26', label: 'Santo Stefano' },
    { date: '2025-12-27', label: 'Vacanze di Natale' },
    { date: '2025-12-29', label: 'Vacanze di Natale' },
    { date: '2025-12-30', label: 'Vacanze di Natale' },
    { date: '2025-12-31', label: 'Vacanze di Natale' },
    { date: '2026-01-02', label: 'Vacanze di Natale' },
    { date: '2026-01-03', label: 'Vacanze di Natale' },
    { date: '2026-01-05', label: 'Vacanze di Natale' },
    { date: '2026-01-06', label: 'Epifania' },
    { date: '2026-04-02', label: 'Vacanze di Pasqua' },
    { date: '2026-04-03', label: 'Vacanze di Pasqua' },
    { date: '2026-04-06', label: 'Vacanze di Pasqua' },
    { date: '2026-04-07', label: 'Vacanze di Pasqua' },
    { date: '2026-04-25', label: 'Festa della Liberazione' },
    { date: '2026-05-01', label: 'Festa del Lavoro' },
    { date: '2026-06-01', label: 'Recupero anticipazione a.s.' },
    { date: '2026-06-02', label: 'Festa della Repubblica' },
    { date: '2026-06-29', label: 'Festa del Santo Patrono' },
  ])

  console.log('🎾 Progetto Racchette in Classe (PADEL)...')
  // Calendario aggiornato: giovedì eliminati (4DT non partecipa), lunedì 4CT e venerdì 4AT invariati
  const padelOverrides: Array<{ date: string, hour: number, classId: string }> = [
    ...['2026-04-27', '2026-05-04', '2026-05-11', '2026-05-18'].flatMap(d => [
      { date: d, hour: 5, classId: byCode['4CT'] },
      { date: d, hour: 6, classId: byCode['4CT'] },
    ]),
    ...['2026-05-08', '2026-05-15', '2026-05-22', '2026-05-29'].flatMap(d => [
      { date: d, hour: 2, classId: byCode['4AT'] },
      { date: d, hour: 3, classId: byCode['4AT'] },
    ]),
  ]
  await db.insert(dayOverrides).values(
    padelOverrides.map(p => ({
      date: p.date, hour: p.hour, kind: 'padel', classId: p.classId,
      note: 'Progetto "Racchette in Classe"',
    }))
  )

  console.log('🏫 Impegni pomeridiani...')
  await db.insert(meetings).values([
    { date: '2026-05-05', kind: 'dipartimento', title: 'Riunione dipartimentale',
      startTime: '15:00:00', endTime: '17:00:00',
      notes: 'Il piano indica "Lunedì 5 maggio", ma cade di martedì — verificare con la scuola' },
    { date: '2026-05-06', kind: 'colloqui', title: 'Colloqui generali scuola-famiglia',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-05-07', kind: 'colloqui', title: 'Colloqui generali scuola-famiglia',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-05-11', kind: 'cdc', title: 'Consigli di classe',
      startTime: '15:00:00', notes: 'Adozione libri di testo + andamento' },
    { date: '2026-05-12', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-13', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-14', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-15', kind: 'cdc', title: 'Consigli di classe', startTime: '15:00:00' },
    { date: '2026-05-18', kind: 'collegio', title: 'Collegio docenti',
      startTime: '15:00:00', endTime: '17:00:00' },
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutini II quadrimestre', notes: 'Inizio' },
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-10', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutini II quadrimestre' },
    { date: '2026-06-12', kind: 'scrutini', title: 'Scrutini II quadrimestre', notes: 'Fine' },
  ])

  console.log('✅ Seed completato!')
  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Seed fallito:', e)
  process.exit(1)
})
