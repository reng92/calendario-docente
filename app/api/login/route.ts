import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE, sha256Hex } from '@/app/login/hash'

export async function POST(req: Request) {
  const expected = process.env.APP_PASSWORD
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'APP_PASSWORD non configurata' }, { status: 500 })
  }
  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, await sha256Hex(expected), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
  return NextResponse.json({ ok: true })
}
