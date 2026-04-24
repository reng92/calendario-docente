import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const cookie = req.cookies.get('app-auth')?.value
  const isAuth = cookie === process.env.APP_PASSWORD
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isLoginApi = req.nextUrl.pathname.startsWith('/api/login')

  if (!isAuth && !isLoginPage && !isLoginApi) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
