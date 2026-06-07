import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { autoMigrate } from '@/lib/migrate'

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

    if (demand.userId !== session.userId) {
      return NextResponse.json({ error: 'Tu ne peux marquer que tes propres annonces' }, { status: 403 })
    }

    if (demand.status === 'sold') {
      return NextResponse.json({ error: 'Cette annonce est déjà marquée comme vendue/achetée' }, { status: 400 })
    }

    const isVente = demand.annonceType === 'vends'

    const updated = await db.demand.update({
      where: { id: demandId },
      data: { status: 'sold' },
    })

    await db.user.update({
      where: { id: session.userId },
      data: isVente
        ? { salesCount: { increment: 1 } }
        : { purchasesCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      demand: updated,
      type: isVente ? 'sold' : 'bought',
    })
  } catch (error) {
    console.error('Sold error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
