import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { endpoint } = await req.json() as { endpoint: string }
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  return NextResponse.json({ ok: true })
}
