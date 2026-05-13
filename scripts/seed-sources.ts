import 'dotenv/config'
import { db } from '../db'
import { sources } from '../db/schema'
import { sql } from 'drizzle-orm'

async function seedSources() {
  await db.execute(sql`DELETE FROM sources`)

  await db.insert(sources).values([
    {
      key: 'scuola',
      label: 'IIS Einstein-Bachelet',
      url: 'https://www.bacheleteinstein.edu.it/feed?view=comunicati',
      kind: 'rss',
      keywords: [],
      active: true,
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
