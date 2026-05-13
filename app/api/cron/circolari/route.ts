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

      // Marca tutte come viste
      for (const item of newItems) {
        await db.insert(circolariSeen).values({
          sourceKey: source.key,
          externalId: item.externalId,
          titolo: item.title,
          url: item.link,
          pubblicataIl: item.pubDate,
          notificataIl: null,
        })
      }

      // Filtra per keywords e manda UNA SOLA notifica (la più recente che matcha)
      const keywords = source.keywords ?? []
      const toNotify = newItems.filter(item =>
        keywords.length === 0 || keywords.some(kw => item.title.toLowerCase().includes(kw.toLowerCase()))
      )
      if (toNotify.length === 0) continue

      const latest = toNotify[0] // già in ordine feed (più recente prima)
      const body = toNotify.length > 1
        ? `${latest.title} (+${toNotify.length - 1} altre)`
        : latest.title

      const dedupeKey = `circolare:${source.key}:${latest.externalId}`
      try {
        await db.insert(notificationLog).values({ kind: 'circolare', dedupeKey })
      } catch {
        continue
      }

      await db.update(circolariSeen)
        .set({ notificataIl: new Date() })

      await sendPushToAll({
        title: `📢 ${source.label}`,
        body,
        url: latest.link || '/',
        tag: `circ-${source.key}`,
      })

      totalPushed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${source.key}: ${msg}`)
    }
  }

  return NextResponse.json({ ok: true, pushed: totalPushed, errors })
}
