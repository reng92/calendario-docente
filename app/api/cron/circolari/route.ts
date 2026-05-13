import { NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/auth/cron'
import { db } from '@/db'
import { sources, circolariSeen, notificationLog } from '@/db/schema'
import { sendPushToAll } from '@/lib/push'
import { eq, and } from 'drizzle-orm'
import Parser from 'rss-parser'

const rss = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalendarioDocente/1.0)' },
})

export async function POST(req: Request) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const activeSources = await db.select().from(sources).where(eq(sources.active, true))

  if (activeSources.length === 0) {
    return NextResponse.json({ ok: true, message: 'no active sources' })
  }

  let totalPushed = 0
  const errors: string[] = []

  for (const source of activeSources) {
    try {
      const feed = await rss.parseURL(source.url)
      const items = feed.items.slice(0, 20)

      let pushedThisSource = 0

      for (const item of items) {
        const externalId = item.guid ?? item.link ?? `${item.title}-${item.pubDate}`
        if (!externalId || !item.title) continue

        // Check if already seen
        const existing = await db
          .select({ id: circolariSeen.id })
          .from(circolariSeen)
          .where(
            and(
              eq(circolariSeen.sourceKey, source.key),
              eq(circolariSeen.externalId, externalId),
            )
          )
          .then(r => r[0])

        if (existing) continue

        const pubblicataIl = item.pubDate ? new Date(item.pubDate) : null
        const url = item.link ?? ''

        // Check keywords filter
        const keywords = source.keywords ?? []
        const shouldNotify =
          keywords.length === 0 ||
          keywords.some(kw => item.title!.toLowerCase().includes(kw.toLowerCase()))

        // Insert as seen
        await db.insert(circolariSeen).values({
          sourceKey: source.key,
          externalId,
          titolo: item.title,
          url,
          pubblicataIl,
          notificataIl: shouldNotify && pushedThisSource < 5 ? new Date() : null,
        })

        if (!shouldNotify || pushedThisSource >= 5 || totalPushed >= 5) continue

        const dedupeKey = `circolare:${source.key}:${externalId}`
        try {
          await db.insert(notificationLog).values({ kind: 'circolare', dedupeKey })
        } catch {
          continue // already notified
        }

        await sendPushToAll({
          title: `📢 ${source.label}`,
          body: item.title,
          url: url || '/',
          tag: `circolare-${source.key}-${externalId}`.slice(0, 64),
        })

        pushedThisSource++
        totalPushed++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Errore fetch source ${source.key}:`, msg)
      errors.push(`${source.key}: ${msg}`)
    }
  }

  return NextResponse.json({ ok: true, pushed: totalPushed, errors })
}
