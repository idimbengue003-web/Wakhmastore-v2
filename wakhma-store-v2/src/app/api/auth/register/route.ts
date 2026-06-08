import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { autoMigrate } from '@/lib/migrate'
import { rateLimiters } from '@/lib/rate-limit'
import { validateApi, registerSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    // Rate limiting - 3 registrations per hour per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const { success: registerAllowed } = rateLimiters.register(ip)
    if (!registerAllowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    await autoMigrate()

    const body = await request.json()

    // Clean phone before validation
    if (body.phone && typeof body.phone === 'string') {
      body.phone = body.phone.replace(/[\s+]/g, '').replace(/^221/, '')
    }

    const validation = validateApi(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { name, phone, password, userType } = validation.data
    const phoneClean = phone

    const existing = await db.user.findUnique({ where: { phone: phoneClean } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà utilisé' },
        { status: 400 }
      )
    }

    const hashedPassword = hashPassword(password)

    const user = await db.user.create({
      data: {
        name,
        phone: phoneClean,
        password: hashedPassword,
        role: 'user',
        userType,
        points: 0,
        salesCount: 0,
        purchasesCount: 0,
      },
    })

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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
