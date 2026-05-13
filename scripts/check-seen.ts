import 'dotenv/config'
import { db } from '../db'
import { circolariSeen } from '../db/schema'

async function main() {
  const rows = await db.select().from(circolariSeen)
  console.log('Totale voci viste:', rows.length)
  const bySource: Record<string, number> = {}
  for (const r of rows) bySource[r.sourceKey] = (bySource[r.sourceKey] ?? 0) + 1
  console.log('Per fonte:', JSON.stringify(bySource, null, 2))
  rows.slice(0, 10).forEach(r => console.log(' -', r.sourceKey, '|', r.titolo.slice(0, 70)))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
