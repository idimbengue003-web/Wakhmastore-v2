import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoMigrate } from '@/lib/migrate'

export async function GET() {
  try {
    await autoMigrate()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        points: true,
        subscriptionTier: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        userType: true,
        salesCount: true,
        purchasesCount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Check if subscription has expired — auto-downgrade
    if (user.subscriptionTier && user.subscriptionEnd) {
      const endDate = new Date(user.subscriptionEnd)
      if (endDate < new Date()) {
        // Subscription expired — remove tier
        await db.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: null,
            subscriptionStart: null,
            subscriptionEnd: null,
          },
        })
        user.subscriptionTier = null
        user.subscriptionStart = null
        user.subscriptionEnd = null
      }
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
