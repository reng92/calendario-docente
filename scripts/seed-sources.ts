import 'dotenv/config'
import { db } from '../db'
import { sources } from '../db/schema'
import { sql } from 'drizzle-orm'

async function seedSources() {
  await db.execute(sql`DELETE FROM sources`)

  await db.insert(sources).values([
    {
      key: 'scuola',
      label: 'ISISS Magarotto',
      url: 'https://www.isiss-magarotto.edu.it/circolare/feed/',
      kind: 'rss',
      keywords: [],
      active: false, // da attivare dopo verifica del feed
    },
    {
      key: 'usp_roma',
      label: 'USP Roma',
      url: 'https://www.atpromaistruzione.it/atp/news/feed/',
      kind: 'rss',
      keywords: ['supplenze', 'GPS', 'B015', 'A048', 'AM48', 'convocazion', 'graduator', 'docenti'],
      active: true,
    },
  ])

  console.log('✅ Sources seeded')
  process.exit(0)
}

seedSources().catch(e => { console.error(e); process.exit(1) })
