import 'dotenv/config'
import Parser from 'rss-parser'

async function main() {
  const rss = new Parser({ timeout: 10000 })
  try {
    const feed = await rss.parseURL('https://www.bacheleteinstein.edu.it/feed?view=comunicati')
    console.log('Title:', feed.title)
    console.log('Items:', feed.items.length)
    feed.items.slice(0, 3).forEach(i => console.log(' -', i.title, '|', i.link))
  } catch (e: unknown) {
    console.error('ERRORE:', (e as Error).message)
  }
  process.exit(0)
}
main()
