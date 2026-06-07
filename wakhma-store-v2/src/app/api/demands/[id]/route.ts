import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maskPhonesInText, containsPhoneInText, maskPhone } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await autoMigrate()
    const { id } = await params

    const demand = await db.demand.findUnique({
      where: { id },
      include: { user: true, reveals: true },
    })

    if (!demand) {
      return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
    }

    const session = await getSession()
    const isOwner = session?.userId === demand.userId
    const hasRevealed = demand.reveals.some((r) => r.userId === session?.userId)

    const maskedDemand = {
      id: demand.id,
      title: demand.title,
      description: isOwner ? demand.description : maskPhonesInText(demand.description),
      category: demand.category,
      budget: demand.budget,
      price: demand.price,
      quartier: demand.quartier,
      urgency: demand.urgency,
      photo: demand.photo,
      whatsapp: isOwner || hasRevealed ? demand.whatsapp : maskPhone(demand.whatsapp),
      whatsappRevealed: isOwner || hasRevealed,
      status: demand.status,
      annonceType: demand.annonceType || 'cherche',
      expiresAt: demand.expiresAt?.toISOString() || null,
      createdAt: demand.createdAt,
      userName: demand.user.name,
      userSubscriptionTier: demand.user.subscriptionTier,
      userType: demand.user.userType || 'acheteur',
      userSalesCount: demand.user.salesCount || 0,
      userPurchasesCount: demand.user.purchasesCount || 0,
      hasPhoneInText: containsPhoneInText(demand.description),
      revealCount: demand.reveals.length,
    }

    return NextResponse.json({ demand: maskedDemand })
  } catch (error) {
    console.error('Demand GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
