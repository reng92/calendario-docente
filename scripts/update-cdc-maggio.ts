import 'dotenv/config'
import { db } from '../db'
import { classes, meetings } from '../db/schema'
import { eq, inArray, and } from 'drizzle-orm'

async function main() {
  const allClasses = await db.select().from(classes)
  const byCode = Object.fromEntries(allClasses.map(c => [c.code, c.id]))

  const all = await db.select().from(meetings)

  // Elimina CdC novembre 2025
  const novDates = ['2025-11-17', '2025-11-18', '2025-11-19', '2025-11-20']
  const delNov = all.filter(m => m.kind === 'cdc' && novDates.includes(m.date)).map(m => m.id)
  if (delNov.length > 0) {
    await db.delete(meetings).where(inArray(meetings.id, delNov))
    console.log(`🗑️  Rimossi ${delNov.length} CdC novembre 2025`)
  }

  // Elimina CdC generici maggio 2026 (11-15)
  const mayDates = ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15']
  const delMay = all.filter(m => m.kind === 'cdc' && mayDates.includes(m.date)).map(m => m.id)
  if (delMay.length > 0) {
    await db.delete(meetings).where(inArray(meetings.id, delMay))
    console.log(`🗑️  Rimossi ${delMay.length} CdC generici maggio 2026`)
  }

  // Inserisce CdC specifici maggio 2026 (circolare 1060188)
  const cdc = [
    { date: '2026-05-11', startTime: '17:00:00', endTime: '17:45:00', code: '4AT' },
    { date: '2026-05-12', startTime: '15:30:00', endTime: '16:15:00', code: '5CT' },
    { date: '2026-05-12', startTime: '16:15:00', endTime: '17:00:00', code: '4CT' },
    { date: '2026-05-12', startTime: '17:00:00', endTime: '17:45:00', code: '3CT' },
    { date: '2026-05-13', startTime: '16:15:00', endTime: '17:00:00', code: '5ET' },
    { date: '2026-05-13', startTime: '17:45:00', endTime: '18:30:00', code: '3GTB' },
    { date: '2026-05-14', startTime: '16:15:00', endTime: '17:00:00', code: '4DT' },
  ]

  await db.insert(meetings).values(
    cdc.map(c => ({
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      kind: 'cdc',
      title: `Consiglio di classe — ${c.code}`,
      classId: byCode[c.code] ?? null,
      notes: 'Adozione libri di testo + andamento didattico',
    }))
  )
  console.log(`✅ Inseriti ${cdc.length} CdC maggio 2026 con orari`)

  process.exit(0)
}

main().catch(e => {
  console.error('❌', e)
  process.exit(1)
})
