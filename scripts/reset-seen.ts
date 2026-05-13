import 'dotenv/config'
import { db } from '../db'
import { circolariSeen, notificationLog } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

async function main() {
  const sourceKey = process.argv[2]
  if (!sourceKey) {
    console.log('Uso: npx tsx scripts/reset-seen.ts <source_key>')
    console.log('Chiavi disponibili: scuola, usp_roma')
    process.exit(1)
  }
  const deleted = await db.delete(circolariSeen).where(eq(circolariSeen.sourceKey, sourceKey))
  await db.delete(notificationLog).where(
    sql`kind = 'circolare' AND dedupe_key LIKE ${'circolare:' + sourceKey + ':%'}`
  )
  console.log(`✅ Reset ${sourceKey}: voci cancellate. Il prossimo cron le tratterà come nuove.`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
