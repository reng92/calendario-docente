import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const cookieStore = await cookies()
  cookieStore.set('app-auth', password, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}
