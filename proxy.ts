import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const cookie = req.cookies.get('app-auth')?.value
  const isAuth = cookie === process.env.APP_PASSWORD
  const path = req.nextUrl.pathname

  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/api/login') ||
    path.startsWith('/api/push/') ||
    path.startsWith('/api/cron/')

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuth && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-).*)'],
}
