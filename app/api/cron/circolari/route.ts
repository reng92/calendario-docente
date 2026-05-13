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

      // Ordina per data decrescente (più recenti prima), poi prendi le prime 20
      const items = [...feed.items]
        .map(i => ({ ...i, _date: parseItemDate(i.pubDate) }))
        .sort((a, b) => (b._date?.getTime() ?? 0) - (a._date?.getTime() ?? 0))
        .slice(0, 20)

      // Trova le voci NON ancora viste
      const newItems: typeof items = []
      for (const item of items) {
        const externalId = item.guid ?? item.link ?? `${item.title}-${item.pubDate}`
        if (!externalId || !item.title) continue
        const existing = await db
          .select({ id: circolariSeen.id })
          .from(circolariSeen)
          .where(and(eq(circolariSeen.sourceKey, source.key), eq(circolariSeen.externalId, externalId)))
          .then(r => r[0])
        if (!existing) newItems.push({ ...item, _externalId: externalId })
      }

      if (newItems.length === 0) continue

      // Notifica solo le più recenti (max 3 per fonte), marca le altre come viste silenziosamente
      const MAX_NOTIFY = 3
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i] as typeof newItems[0] & { _externalId: string }
        const externalId = item._externalId
        const pubblicataIl = item._date
        const url = item.link ?? ''

        const keywords = source.keywords ?? []
        const shouldNotify =
          i < MAX_NOTIFY &&
          (keywords.length === 0 || keywords.some(kw => item.title!.toLowerCase().includes(kw.toLowerCase())))

        await db.insert(circolariSeen).values({
          sourceKey: source.key,
          externalId,
          titolo: item.title!,
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
          body: item.title!,
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
