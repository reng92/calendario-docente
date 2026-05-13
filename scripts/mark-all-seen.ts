import 'dotenv/config'
import { db } from '../db'
import { sources, circolariSeen } from '../db/schema'
import { eq } from 'drizzle-orm'
import Parser from 'rss-parser'

const rss = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalendarioDocente/1.0)' },
})

async function main() {
  const sourceKey = process.argv[2] ?? 'scuola'
  const [source] = await db.select().from(sources).where(eq(sources.key, sourceKey))
  if (!source) { console.error('Source non trovata:', sourceKey); process.exit(1) }

  const feed = await rss.parseURL(source.url)
  let count = 0
  for (const item of feed.items) {
    const externalId = item.guid ?? item.link ?? `${item.title}-${item.pubDate}`
    if (!externalId || !item.title) continue
    const existing = await db.select({ id: circolariSeen.id }).from(circolariSeen)
      .where(eq(circolariSeen.sourceKey, sourceKey)).then(r => r.find(x => x.id))
    // upsert: segna come vista ma non notificata
    try {
      await db.insert(circolariSeen).values({
        sourceKey,
        externalId,
        titolo: item.title,
        url: item.link ?? '',
        pubblicataIl: null,
        notificataIl: null,
      })
      count++
    } catch { /* già presente */ }
  }
  console.log(`✅ Marchiate ${count} voci di "${sourceKey}" come viste (silenzioso). Le prossime nuove ti arriveranno via push.`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
