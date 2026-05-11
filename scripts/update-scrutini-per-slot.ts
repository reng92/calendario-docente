import 'dotenv/config'
import { db } from '../db'
import { meetings } from '../db/schema'
import { eq } from 'drizzle-orm'

async function update() {
  console.log('🔄 Sostituzione scrutini con slot per classe...')

  const deleted = await db.delete(meetings).where(eq(meetings.kind, 'scrutini')).returning()
  console.log(`  Rimossi ${deleted.length} scrutini generici`)

  // Dati da circ. 301 dell'11-05-2026 — solo classi di Renato
  await db.insert(meetings).values([
    // Lunedì 8 giugno
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutinio 5CT', startTime: '17:35:00', endTime: '18:00:00' },
    { date: '2026-06-08', kind: 'scrutini', title: 'Scrutinio 5ET', startTime: '18:40:00', endTime: '19:25:00' },

    // Martedì 9 giugno
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutinio 3GTB', startTime: '17:00:00', endTime: '17:45:00' },
    { date: '2026-06-09', kind: 'scrutini', title: 'Scrutinio 4DT',  startTime: '17:45:00', endTime: '18:30:00' },

    // Mercoledì 10 giugno — nessuna classe di Renato
    { date: '2026-06-10', kind: 'scrutini', title: 'Scrutini II quadrimestre', startTime: '08:00:00', endTime: '19:15:00', notes: 'Nessuna tua classe in programma' },

    // Giovedì 11 giugno
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 3CT', startTime: '13:15:00', endTime: '14:00:00' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 4CT', startTime: '14:00:00', endTime: '14:45:00' },
    { date: '2026-06-11', kind: 'scrutini', title: 'Scrutinio 4AT', startTime: '14:45:00', endTime: '15:30:00' },
  ])
  console.log('  Scrutini inseriti per slot (8 voci)')
  console.log('✅ Fatto!')
  process.exit(0)
}

update().catch(e => { console.error('❌', e); process.exit(1) })
