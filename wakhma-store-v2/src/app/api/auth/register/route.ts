import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { autoMigrate } from '@/lib/migrate'
import { rateLimiters } from '@/lib/rate-limit'
import { validateApi, registerSchema } from '@/lib/validations'

// Generate a unique referral code: WK + 6 random chars
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'WK'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Referral bonus points
const REFERRAL_BONUS_POINTS = 2000
const MAX_REFERRALS = 40

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
    const { name, phone, password, userType, referralCode } = validation.data
    const phoneClean = phone

    const existing = await db.user.findUnique({ where: { phone: phoneClean } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà utilisé' },
        { status: 400 }
      )
    }

    const hashedPassword = hashPassword(password)

    // Generate a unique referral code for this user
    let userReferralCode = generateReferralCode()
    let codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } })
    while (codeExists) {
      userReferralCode = generateReferralCode()
      codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } })
    }

    // Check referral code from another user
    let referrerId: string | null = null
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } })
      if (referrer && referrer.referralCount < MAX_REFERRALS) {
        referrerId = referrer.id
      }
    }

    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8)

    const user = await db.user.create({
      data: {
        id: userId,
        name,
        phone: phoneClean,
        password: hashedPassword,
        role: 'user',
        userType,
        points: referrerId ? REFERRAL_BONUS_POINTS : 0, // Bonus if referred
        salesCount: 0,
        purchasesCount: 0,
        referralCode: userReferralCode,
        referredBy: referrerId,
      },
    })

    // Credit the referrer with bonus points
    if (referrerId) {
      await db.user.update({
        where: { id: referrerId },
        data: {
          points: { increment: REFERRAL_BONUS_POINTS },
          referralCount: { increment: 1 },
        },
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
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
        points: user.points,
        userType: user.userType,
        salesCount: user.salesCount,
        purchasesCount: user.purchasesCount,
        referralCode: user.referralCode,
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
