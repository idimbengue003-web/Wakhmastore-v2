import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maskPhonesInText, containsPhoneInText, maskPhone } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'
import type { Demand, User, Reveal } from '@prisma/client'

type DemandWithRelations = Demand & { user: User; reveals: Reveal[] }

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await autoMigrate()
    const { id } = await params

    // Auto-expire
    await db.demand.updateMany({
      where: { status: 'active', expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
    })

    const demand = await db.demand.findUnique({
      where: { id },
      include: { user: true, reveals: true },
    })

    if (!demand) {
      return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
    }

    const session = await getSession()
    const d = demand as DemandWithRelations
    const isOwner = session?.userId === d.userId
    const hasRevealed = d.reveals.some((r) => r.userId === session?.userId)

    const masked = {
      id: d.id,
      title: d.title,
      description: isOwner ? d.description : maskPhonesInText(d.description),
      category: d.category,
      budget: d.budget,
      price: d.price,
      quartier: d.quartier,
      urgency: d.urgency,
      photo: d.photo,
      whatsapp: isOwner || hasRevealed ? d.whatsapp : maskPhone(d.whatsapp),
      whatsappRevealed: isOwner || hasRevealed,
      status: d.status,
      annonceType: d.annonceType || 'cherche',
      expiresAt: d.expiresAt?.toISOString() || null,
      createdAt: d.createdAt,
      userName: d.user.name,
      userSubscriptionTier: d.user.subscriptionTier,
      userType: d.user.userType || 'acheteur',
      userSalesCount: d.user.salesCount || 0,
      userPurchasesCount: d.user.purchasesCount || 0,
      hasPhoneInText: containsPhoneInText(d.description),
    }

    return NextResponse.json({ demand: masked })
  } catch (error) {
    console.error('Demand detail error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
