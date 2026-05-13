import { NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/auth/cron'
import { db } from '@/db'
import { sources, circolariSeen, notificationLog } from '@/db/schema'
import { sendPushToAll } from '@/lib/push'
import { eq, and } from 'drizzle-orm'
import Parser from 'rss-parser'

function parseItemDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const itMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (itMatch) return new Date(`${itMatch[3]}-${itMatch[2].padStart(2,'0')}-${itMatch[1].padStart(2,'0')}`)
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

const rss = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalendarioDocente/1.0)' },
})

export async function POST(req: Request) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const activeSources = await db.select().from(sources).where(eq(sources.active, true))
  if (activeSources.length === 0) return NextResponse.json({ ok: true, message: 'no active sources' })

  let totalPushed = 0
  const errors: string[] = []

  for (const source of activeSources) {
    try {
      const feed = await rss.parseURL(source.url)

      // Il feed RSS restituisce già gli item dalla più recente — non riordinare
      const items = feed.items.slice(0, 20).map(i => ({ ...i, _date: parseItemDate(i.pubDate) }))

      // Trova le voci NON ancora viste
      type NewItem = { externalId: string; title: string; link: string; pubDate: Date | null }
      const newItems: NewItem[] = []
      for (const item of items) {
        const externalId = item.guid ?? item.link ?? `${item.title}-${item.pubDate}`
        if (!externalId || !item.title) continue
        const existing = await db
          .select({ id: circolariSeen.id })
          .from(circolariSeen)
          .where(and(eq(circolariSeen.sourceKey, source.key), eq(circolariSeen.externalId, externalId)))
          .then(r => r[0])
        if (!existing) newItems.push({ externalId, title: item.title, link: item.link ?? '', pubDate: item._date })
      }

      if (newItems.length === 0) continue

      // Notifica solo le più recenti (max 3 per fonte), marca le altre come viste silenziosamente
      const MAX_NOTIFY = 3
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i]
        const externalId = item.externalId
        const pubblicataIl = item.pubDate
        const url = item.link

        const keywords = source.keywords ?? []
        const shouldNotify =
          i < MAX_NOTIFY &&
          (keywords.length === 0 || keywords.some(kw => item.title.toLowerCase().includes(kw.toLowerCase())))

        await db.insert(circolariSeen).values({
          sourceKey: source.key,
          externalId,
          titolo: item.title,
          url,
          pubblicataIl,
          notificataIl: shouldNotify ? new Date() : null,
        })

        if (!shouldNotify) continue

        const dedupeKey = `circolare:${source.key}:${externalId}`
        try {
          await db.insert(notificationLog).values({ kind: 'circolare', dedupeKey })
        } catch {
          continue
        }

        await sendPushToAll({
          title: `📢 ${source.label}`,
          body: item.title,
          url: url || '/',
          tag: `circ-${source.key}-${externalId}`.slice(0, 64),
        })

        totalPushed++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${source.key}: ${msg}`)
    }
  }

  return NextResponse.json({ ok: true, pushed: totalPushed, errors })
}
