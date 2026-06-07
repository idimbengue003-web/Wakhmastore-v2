import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoMigrate } from '@/lib/migrate'

// GET /api/payment/history — Get payment history for the logged-in user
export async function GET() {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const payments = await db.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        orderReference: true,
        tierIndex: true,
        tierId: true,
        provider: true,
        senderPhone: true,
        transactionId: true,
        createdAt: true,
        completedAt: true,
        adminNote: true,
      },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[Payment History] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
