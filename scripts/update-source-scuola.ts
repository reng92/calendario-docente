import 'dotenv/config'
import { db } from '../db'
import { sources } from '../db/schema'
import { eq } from 'drizzle-orm'

/** Aggiorna la sorgente "scuola" al feed circolari ISISS Magarotto. */
async function main() {
  const values = {
    label: 'ISISS Magarotto',
    url: 'https://www.isiss-magarotto.edu.it/circolare/feed/',
    kind: 'rss',
    keywords: [] as string[],
    active: true,
  }
  const updated = await db.update(sources).set(values).where(eq(sources.key, 'scuola')).returning()
  if (updated.length === 0) {
    await db.insert(sources).values({ key: 'scuola', ...values })
    console.log('✅ Sorgente "scuola" creata')
  } else {
    console.log('✅ Sorgente "scuola" aggiornata:', updated[0])
  }
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
