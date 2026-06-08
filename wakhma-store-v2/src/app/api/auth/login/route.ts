import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { rateLimiters } from '@/lib/rate-limit'
import { validateApi, loginSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    // Rate limiting - 5 attempts per 15 min per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const { success: loginAllowed } = rateLimiters.login(ip)
    if (!loginAllowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Clean phone before validation
    if (body.phone && typeof body.phone === 'string') {
      body.phone = body.phone.replace(/[\s+]/g, '').replace(/^221/, '')
    }

    const validation = validateApi(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { phone, password } = validation.data
    const phoneClean = phone

    const user = await db.user.findUnique({ where: { phone: phoneClean } })
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Numéro ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const isValid = verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Numéro ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
    })

    const response = NextResponse.json({
      user: {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        subscriptionEnd: user.subscriptionEnd,
        points: user.points,
        userType: user.userType,
        salesCount: user.salesCount,
        purchasesCount: user.purchasesCount,
      },
    })

    response.cookies.set('wakhma_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
