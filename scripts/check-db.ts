import 'dotenv/config'
import { db } from '../db'
import { meetings, dayOverrides } from '../db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const scrutini = await db.select().from(meetings).where(eq(meetings.kind, 'scrutini'))
  console.log('SCRUTINI:', scrutini.map(x => `${x.date} ${x.startTime}–${x.endTime} | ${x.notes ?? ''}`))
  const overrides = await db.select().from(dayOverrides).where(eq(dayOverrides.date, '2026-05-13'))
  console.log('OVERRIDES 13/5:', JSON.stringify(overrides, null, 2))
  process.exit(0)
}
main()
