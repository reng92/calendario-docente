import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { endpoint, keys, deviceLabel } = await req.json() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
    deviceLabel?: string
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await db
    .insert(pushSubscriptions)
    .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, deviceLabel: deviceLabel ?? null })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: keys.p256dh, auth: keys.auth, lastSeenAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
