import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToAll(payload: object) {
  const subs = await db.select().from(pushSubscriptions)
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)))
}

async function sendToSubscription(
  s: { id: number; endpoint: string; p256dh: string; auth: string },
  payload: object,
) {
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      JSON.stringify(payload),
    )
  } catch (err: unknown) {
    const e = err as { statusCode?: number }
    if (e.statusCode === 404 || e.statusCode === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id))
    } else {
      console.error('push error', err)
    }
  }
}
