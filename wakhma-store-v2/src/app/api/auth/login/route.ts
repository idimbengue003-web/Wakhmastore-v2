import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Téléphone et mot de passe requis' },
        { status: 400 }
      )
    }

    const phoneClean = phone.replace(/[\s+]/g, '').replace(/^221/, '')

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
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion', detail: msg },
      { status: 500 }
    )
  }
}
