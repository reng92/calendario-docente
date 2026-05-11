import 'dotenv/config'
import { db } from '../db'
import { classes, weeklySlots, dayOverrides } from '../db/schema'
import { eq } from 'drizzle-orm'
import { format, parseISO } from 'date-fns'

async function main() {
  // Fetch exactly what page.tsx fetches
  const overridesData = await db.select().from(dayOverrides)
  const weeklyData = await db.select().from(weeklySlots)
  const classesData = await db.select().from(classes)

  // Map exactly as page.tsx does
  const mappedOverrides = overridesData.map(o => ({
    date: o.date, hour: o.hour, kind: o.kind, classId: o.classId, note: o.note,
  }))

  // Check what May 13 looks like
  const may13overrides = mappedOverrides.filter(o => {
    const d = o.date
    console.log(`  override date type: ${typeof d}, value: ${JSON.stringify(d)}, === '2026-05-13': ${d === '2026-05-13'}`)
    return true
  }).filter(o => String(o.date).includes('05-13'))

  console.log('\nMay 13 overrides:', may13overrides)

  // Check if the map key matching works
  const byDate = new Map<string, typeof mappedOverrides>()
  for (const o of mappedOverrides) {
    const k = String(o.date) // force to string
    const list = byDate.get(k) ?? []
    list.push(o)
    byDate.set(k, list)
  }

  const iso = '2026-05-13'
  console.log('\nMap lookup "2026-05-13":', byDate.get(iso))

  // Check hour types
  const slots5CT = weeklyData.filter(s => {
    const c = classesData.find(c => c.id === s.classId)
    return c?.code === '5CT' && s.weekday === 2
  })
  console.log('\n5CT Wednesday slots:')
  slots5CT.forEach(s => {
    console.log(`  hour=${s.hour} type=${typeof s.hour}`)
    const overrideMatch = may13overrides.find(o => {
      console.log(`    comparing o.hour(${typeof o.hour})=${o.hour} vs s.hour(${typeof s.hour})=${s.hour}: ${o.hour === s.hour}`)
      console.log(`    comparing o.classId=${o.classId} vs s.classId=${s.classId}: ${o.classId === s.classId}`)
      return o.hour === s.hour && o.classId === s.classId
    })
    console.log(`  => override found: ${!!overrideMatch}`)
  })

  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
