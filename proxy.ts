import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, sha256Hex } from '@/app/login/hash'

const PUBLIC_PREFIXES = ['/login', '/api/login', '/api/push/', '/api/cron/']

export async function proxy(req: NextRequest) {
  const expected = process.env.APP_PASSWORD
  // Senza password configurata l'app resta aperta (evita di chiudersi fuori per un env mancante)
  if (!expected) return NextResponse.next()

  const path = req.nextUrl.pathname
  const isPublic = PUBLIC_PREFIXES.some(p => path.startsWith(p))
  const cookie = req.cookies.get(AUTH_COOKIE)?.value
  const isAuth = !!cookie && cookie === (await sha256Hex(expected))

  if (!isAuth && !isPublic) {
    const url = new URL('/login', req.url)
    if (path !== '/' && !path.startsWith('/api/')) url.searchParams.set('next', path)
    if (path.startsWith('/api/')) return new NextResponse('Unauthorized', { status: 401 })
    return NextResponse.redirect(url)
  }
  if (isAuth && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/oggi', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-).*)'],
}
