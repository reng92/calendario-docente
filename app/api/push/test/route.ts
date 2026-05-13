import { NextResponse } from 'next/server'
import { sendPushToAll } from '@/lib/push'

export async function POST() {
  await sendPushToAll({
    title: '✅ Push funziona!',
    body: 'Notifiche attive su questo dispositivo.',
    url: '/',
    tag: 'test',
  })
  return NextResponse.json({ ok: true })
}
