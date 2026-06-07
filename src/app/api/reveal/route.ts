import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getRevealPrice } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'
import type { Demand, Reveal } from '@prisma/client'

type DemandWithReveals = Demand & { reveals: Reveal[] }

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

    const demand = await db.demand.findUnique({
      where: { id: demandId },
      include: { reveals: true },
    }) as DemandWithReveals | null

    if (!demand) {
      return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
    }

    // Check if already revealed
    const alreadyRevealed = demand.reveals.some((r) => r.userId === session.userId)
    if (alreadyRevealed) {
      return NextResponse.json({
        whatsapp: demand.whatsapp,
        alreadyRevealed: true,
      })
    }

    // Check if owner
    if (demand.userId === session.userId) {
      return NextResponse.json({
        whatsapp: demand.whatsapp,
        isOwner: true,
      })
    }

    // Calculate price
    const price = getRevealPrice(session.role, session.subscriptionTier)

    // Check user points
    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    if (user.points < price) {
      return NextResponse.json(
        { error: `Points insuffisants. Il vous faut ${price} pts. Solde: ${user.points} pts` },
        { status: 400 }
      )
    }

    // Deduct points and create reveal
    await db.$transaction([
      db.user.update({
        where: { id: session.userId },
        data: { points: { decrement: price } },
      }),
      db.reveal.create({
        data: {
          userId: session.userId,
          demandId: demand.id,
        },
      }),
    ])

    return NextResponse.json({
      whatsapp: demand.whatsapp,
      priceDeducted: price,
    })
  } catch (error) {
    console.error('Reveal error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
