import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots } from '../db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const cls = await db.select().from(classes).where(eq(classes.code, '5CT'))
  console.log('5CT id:', cls[0]?.id)
  const slots = await db.select().from(weeklySlots).where(eq(weeklySlots.classId, cls[0].id))
  console.log('5CT slots:', slots.map(s => `wd${s.weekday} h${s.hour}`))
  process.exit(0)
}
main()
