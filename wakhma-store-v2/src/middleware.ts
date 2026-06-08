import { NextResponse, NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'wakhma-dev-secret-2024')

interface TokenPayload {
  userId: string
  phone: string
  role: string
  name: string
  subscriptionTier?: string | null
}

function verifyTokenSafe(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// Protected page routes that require authentication (redirect to /login)
const PROTECTED_PAGE_ROUTES = ['/profil', '/deposer', '/recharge', '/abonnements']

// Admin page routes that require admin role
const ADMIN_PAGE_ROUTES = ['/admin']

// Admin API routes prefix
const ADMIN_API_PREFIX = '/api/admin'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the JWT token from cookies
  const token = request.cookies.get('wakhma_token')?.value

  // --- Admin API routes: /api/admin/* ---
  if (pathname.startsWith(ADMIN_API_PREFIX)) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 403 }
      )
    }

    const payload = verifyTokenSafe(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé. Droits administrateur requis.' },
        { status: 403 }
      )
    }

    return NextResponse.next()
  }

  // --- Admin page route: /admin ---
  if (ADMIN_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = verifyTokenSafe(token)
    if (!payload || payload.role !== 'admin') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      loginUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // --- Protected page routes: /profil, /deposer, /recharge, /abonnements ---
  if (PROTECTED_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = verifyTokenSafe(token)
    if (!payload) {
      // Token is invalid/expired — clear it and redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set('wakhma_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }

    return NextResponse.next()
  }

  // --- All other routes: public access ---
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
