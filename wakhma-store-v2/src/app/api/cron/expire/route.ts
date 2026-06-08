import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Vercel Cron endpoint - called automatically by Vercel
// Also callable manually with a secret key
export async function GET(request: NextRequest) {
  // Verify cron secret (prevent unauthorized calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // 1. Expire old demands
    await db.demand.updateMany({
      where: { status: 'active', expiresAt: { lt: now } },
      data: { status: 'expired' },
    })

    // 2. Remove subscription from expired users
    await db.user.updateMany({
      where: {
        subscriptionTier: { not: null },
        subscriptionEnd: { lt: now.toISOString() },
      },
      data: {
        subscriptionTier: null,
        subscriptionStart: null,
        subscriptionEnd: null,
      },
    })

    console.log(`[cron] Expired demands and subscriptions processed`)

    return NextResponse.json({
      success: true,
      message: 'Expired demands and subscriptions processed',
    })
  } catch (error) {
    console.error('[cron] Error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
