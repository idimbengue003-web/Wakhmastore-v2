import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { VENDOR_ANNONCE_LIMITS } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'

// Renew an expired annonce - resets expiresAt to 7 days from now
export async function POST(request: Request) {
  try {
    await autoMigrate()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const { demandId } = body

    if (!demandId) {
      return NextResponse.json({ error: 'demandId requis' }, { status: 400 })
    }

    const demand = await db.demand.findUnique({ where: { id: demandId } })
    if (!demand) {
      return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
    }

    // Only the owner can renew
    if (demand.userId !== session.userId) {
      return NextResponse.json({ error: 'Tu ne peux renouveler que tes propres annonces' }, { status: 403 })
    }

    // Only expired annonces can be renewed
    if (demand.status !== 'expired') {
      return NextResponse.json({ error: 'Seules les annonces expirées peuvent être renouvelées' }, { status: 400 })
    }

    // For "Je vends" annonces, check subscription limit
    if (demand.annonceType === 'vends') {
      const user = await db.user.findUnique({ where: { id: session.userId } })
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }

      const subTier = user.subscriptionTier || 'none'
      const maxAnnonces = VENDOR_ANNONCE_LIMITS[subTier] ?? 0

      if (maxAnnonces === 0) {
        return NextResponse.json(
          { error: 'Ton abonnement a expiré. Prends un abonnement Diambar 💎 ou VIP KING ⭐ pour renouveler tes annonces de vente.' },
          { status: 403 }
        )
      }

      // Count current active "Je vends" annonces
      const activeVentes = await db.demand.count({
        where: {
          userId: session.userId,
          annonceType: 'vends',
          status: 'active',
        },
      })

      if (activeVentes >= maxAnnonces) {
        return NextResponse.json(
          { error: `Tu as déjà ${activeVentes} annonces de vente actives. Supprime-en une d'abord.` },
          { status: 400 }
        )
      }
    }

    // Renew: set new expiresAt (7 days from now) and status back to active
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    const updated = await db.demand.update({
      where: { id: demandId },
      data: {
        status: 'active',
        expiresAt: newExpiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      demand: updated,
      newExpiresAt: newExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Renew error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
