import 'dotenv/config'
import { db } from '../db'
import { circolariSeen, notificationLog } from '../db/schema'
import { eq, like } from 'drizzle-orm'

async function main() {
  const seen = await db.select().from(circolariSeen).where(eq(circolariSeen.sourceKey, 'scuola'))
  console.log('circolari_seen scuola:', seen.length)
  seen.slice(0, 5).forEach(r => console.log('  seen:', r.titolo?.slice(0, 60)))

  const logs = await db.select().from(notificationLog)
    .where(like(notificationLog.dedupeKey, 'circolare:scuola:%'))
  console.log('notification_log scuola:', logs.length)
  logs.slice(0, 5).forEach(l => console.log('  log:', l.dedupeKey.slice(0, 80)))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
