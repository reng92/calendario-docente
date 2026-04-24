import 'dotenv/config'
import { db } from '../db'
import { dayOverrides, classes } from '../db/schema'
import { eq, and } from 'drizzle-orm'

async function updatePadel() {
  // Remove all existing padel overrides
  await db.delete(dayOverrides).where(eq(dayOverrides.kind, 'padel'))
  console.log('🗑️  Padel precedenti eliminati')

  const allClasses = await db.select().from(classes)
  const byCode = Object.fromEntries(allClasses.map(c => [c.code, c.id]))

  // Mondays → 4CT ore 5,6
  const mondays = ['2026-04-27', '2026-05-04', '2026-05-11', '2026-05-18']
  // Fridays → 4AT ore 2,3
  const fridays = ['2026-05-08', '2026-05-15', '2026-05-22', '2026-05-29']

  const overrides = [
    ...mondays.flatMap(d => [
      { date: d, hour: 5, classId: byCode['4CT'] },
      { date: d, hour: 6, classId: byCode['4CT'] },
    ]),
    ...fridays.flatMap(d => [
      { date: d, hour: 2, classId: byCode['4AT'] },
      { date: d, hour: 3, classId: byCode['4AT'] },
    ]),
  ]

  await db.insert(dayOverrides).values(
    overrides.map(o => ({
      ...o,
      kind: 'padel',
      note: 'Progetto "Racchette in Classe"',
    }))
  )

  console.log(`✅ Inseriti ${overrides.length} slot padel (lun 4CT + ven 4AT, giovedì rimossi)`)
  process.exit(0)
}

updatePadel().catch(e => {
  console.error('❌ Errore:', e)
  process.exit(1)
})
