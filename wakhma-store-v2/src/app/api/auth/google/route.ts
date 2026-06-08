import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { autoMigrate } from '@/lib/migrate'

const GOOGLE_CLIENT_ID = '645891430275-48re5e0v1nagsnei4al8pel4ff9dknq1.apps.googleusercontent.com'

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

// Generate a unique referral code: WK + 6 random chars
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'WK'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

interface GoogleTokenPayload {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture?: string
  given_name?: string
  family_name?: string
}

async function verifyGoogleToken(token: string): Promise<GoogleTokenPayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload || !payload.sub) return null
    return payload as unknown as GoogleTokenPayload
  } catch (error) {
    console.error('Google token verification failed:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { credential } = body

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'Token Google manquant' },
        { status: 400 }
      )
    }

    // Verify the Google token
    const payload = await verifyGoogleToken(credential)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token Google invalide' },
        { status: 401 }
      )
    }

    const { sub: googleId, email, name } = payload

    await autoMigrate()

    // Try to find existing user by googleId
    let user = await db.user.findUnique({ where: { googleId } })

    // If not found by googleId, try by email (email is not unique constraint, use findFirst)
    if (!user && email) {
      user = await db.user.findFirst({ where: { email } })

      // If found by email, link the googleId
      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: { googleId },
        })
      }
    }

    // If no existing user, create one
    if (!user) {
      // Generate a unique placeholder phone for Google users
      // Format: goog_{googleId} — guaranteed unique since googleId is unique
      const placeholderPhone = `goog_${googleId}`

      // Generate a unique referral code
      let referralCode = generateReferralCode()
      let codeExists = await db.user.findUnique({ where: { referralCode } })
      while (codeExists) {
        referralCode = generateReferralCode()
        codeExists = await db.user.findUnique({ where: { referralCode } })
      }

      user = await db.user.create({
        data: {
          id: 'google-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
          name: name || 'Utilisateur Google',
          phone: placeholderPhone,
          email: email || null,
          googleId,
          password: null,
          role: 'user',
          userType: 'acheteur',
          points: 0,
          salesCount: 0,
          purchasesCount: 0,
          referralCode,
        },
      })
    } else {
      // Update email/name if they've changed in Google
      const updateData: Record<string, unknown> = {}
      if (email && user.email !== email) updateData.email = email
      if (name && user.name !== name && !user.name.startsWith('goog_')) updateData.name = name

      if (Object.keys(updateData).length > 0) {
        user = await db.user.update({
          where: { id: user.id },
          data: updateData,
        })
      }
    }

    // Sign our own JWT token
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
        subscriptionEnd: user.subscriptionEnd,
        points: user.points,
        userType: user.userType,
        salesCount: user.salesCount,
        purchasesCount: user.purchasesCount,
        email: user.email,
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
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion Google' },
      { status: 500 }
    )
  }
}
