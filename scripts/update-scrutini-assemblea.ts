import 'dotenv/config'
import { db } from '../db'
import { meetings, dayOverrides, classes } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

async function update() {
  console.log('🔄 Aggiornamento scrutini e assemblea sindacale...')

  // 1. Remove old scrutini (June 8–12)
  const deleted = await db.delete(meetings)
    .where(eq(meetings.kind, 'scrutini'))
    .returning()
  console.log(`  Rimossi ${deleted.length} scrutini vecchi`)

  // 2. Insert scrutini per slot (circ. 301 del 11-05-2026) — solo classi di Renato
  await db.insert(meetings).values([
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutinio 5CT', startTime: '17:35:00', endTime: '18:00:00' },
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutinio 5ET', startTime: '18:40:00', endTime: '19:25:00' },
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutinio 3GTB', startTime: '17:00:00', endTime: '17:45:00' },
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutinio 4DT',  startTime: '17:45:00', endTime: '18:30:00' },
    { date: '2026-06-10', kind: 'scrutini', title: 'Scrutini II quadrimestre', startTime: '08:00:00', endTime: '19:15:00', notes: 'Nessuna tua classe in programma' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 3CT', startTime: '13:15:00', endTime: '14:00:00' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 4CT', startTime: '14:00:00', endTime: '14:45:00' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 4AT', startTime: '14:45:00', endTime: '15:30:00' },
  ])
  console.log('  Scrutini inseriti per slot (8–11 giugno, solo classi di Renato)')

  // 3. Assemblea sindacale mercoledì 13 maggio, ore 1–2 (5CT)
  const [ct5] = await db.select({ id: classes.id }).from(classes).where(eq(classes.code, '5CT'))
  if (!ct5) throw new Error('Classe 5CT non trovata nel DB')

  // Remove any existing assembly overrides for that date to avoid duplicates
  await db.delete(dayOverrides).where(
    and(eq(dayOverrides.date, '2026-05-13'), eq(dayOverrides.kind, 'assembly'))
  )

  await db.insert(dayOverrides).values([
    { date: '2026-05-13', hour: 1, kind: 'assembly', classId: ct5.id, note: 'Assemblea sindacale – prime 2 ore' },
    { date: '2026-05-13', hour: 2, kind: 'assembly', classId: ct5.id, note: 'Assemblea sindacale – prime 2 ore' },
  ])
  console.log('  Assemblea sindacale 13/05 aggiunta (ore 1ª e 2ª, 5CT)')

  console.log('✅ Aggiornamento completato!')
  process.exit(0)
}

update().catch(e => {
  console.error('❌ Errore:', e)
  process.exit(1)
})
