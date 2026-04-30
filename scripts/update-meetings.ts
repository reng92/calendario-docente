import 'dotenv/config'
import { db } from '../db'
import { classes, meetings } from '../db/schema'
import { eq, inArray } from 'drizzle-orm'

async function main() {
  const allClasses = await db.select().from(classes)
  const byCode = Object.fromEntries(allClasses.map(c => [c.code, c.id]))

  // Rimuove i 5 scrutini generici (8-12 giu) inseriti dal seed
  const scrutiniDates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12']
  const existing = await db.select().from(meetings)
  const toDelete = existing
    .filter(m => m.kind === 'scrutini' && scrutiniDates.includes(m.date))
    .map(m => m.id)

  if (toDelete.length > 0) {
    await db.delete(meetings).where(inArray(meetings.id, toDelete))
    console.log(`🗑️  Rimossi ${toDelete.length} scrutini generici`)
  }

  // Scrutini II Q — orari per classe
  const scrutini = [
    { date: '2026-06-08', startTime: '14:00:00', endTime: '14:45:00', code: '5CT' },
    { date: '2026-06-08', startTime: '15:30:00', endTime: '16:15:00', code: '5ET' },
    { date: '2026-06-09', startTime: '17:00:00', endTime: '17:45:00', code: '3GTB' },
    { date: '2026-06-09', startTime: '17:45:00', endTime: '18:30:00', code: '4DT' },
    { date: '2026-06-11', startTime: '13:15:00', endTime: '14:00:00', code: '3CT' },
    { date: '2026-06-11', startTime: '14:00:00', endTime: '14:45:00', code: '4CT' },
    { date: '2026-06-11', startTime: '14:45:00', endTime: '15:30:00', code: '4AT' },
  ]

  await db.insert(meetings).values(
    scrutini.map(s => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      kind: 'scrutini',
      title: `Scrutinio II Q — ${s.code}`,
      classId: byCode[s.code] ?? null,
    }))
  )
  console.log(`✅ Inseriti ${scrutini.length} scrutini con orari`)

  // Consigli di classe novembre 2025
  const cdc = [
    { date: '2025-11-17', startTime: '17:00:00', endTime: '17:45:00', code: '4AT' },
    { date: '2025-11-18', startTime: '15:30:00', endTime: '16:15:00', code: '5CT' },
    { date: '2025-11-18', startTime: '16:15:00', endTime: '17:00:00', code: '4CT' },
    { date: '2025-11-18', startTime: '17:00:00', endTime: '17:45:00', code: '3CT' },
    { date: '2025-11-19', startTime: '16:15:00', endTime: '17:00:00', code: '5ET' },
    { date: '2025-11-19', startTime: '17:45:00', endTime: '18:30:00', code: '3GTB' },
    { date: '2025-11-20', startTime: '16:15:00', endTime: '17:00:00', code: '4DT' },
  ]

  await db.insert(meetings).values(
    cdc.map(c => ({
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      kind: 'cdc',
      title: `Consiglio di classe — ${c.code}`,
      classId: byCode[c.code] ?? null,
    }))
  )
  console.log(`✅ Inseriti ${cdc.length} consigli di classe (nov 2025)`)

  process.exit(0)
}

main().catch(e => {
  console.error('❌', e)
  process.exit(1)
})
