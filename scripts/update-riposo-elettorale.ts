import 'dotenv/config'
import { db } from '../db'
import { holidays } from '../db/schema'
import { and, eq, inArray } from 'drizzle-orm'

async function update() {
  console.log('🔄 Aggiunta riposo per operazioni elettorali (25-27 maggio 2026)...')

  const dates = ['2026-05-25', '2026-05-26', '2026-05-27']
  const label = 'Riposo per operazioni elettorali'

  // Idempotente: rimuovo eventuali voci precedenti con stessa label/data
  await db.delete(holidays).where(
    and(inArray(holidays.date, dates), eq(holidays.label, label))
  )

  await db.insert(holidays).values(
    dates.map(date => ({ date, label }))
  )

  console.log(`  Aggiunti ${dates.length} giorni di riposo (rappresentante di lista ai seggi 23-25 maggio)`)
  console.log('✅ Fatto!')
  process.exit(0)
}

update().catch(e => { console.error('❌', e); process.exit(1) })
