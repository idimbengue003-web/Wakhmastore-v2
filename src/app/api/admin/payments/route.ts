import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { autoMigrate } from '@/lib/migrate'
import { POINTS_TIERS, SUBSCRIPTION_TIERS } from '@/lib/constants'

// GET /api/admin/payments — List all payments (with filters)
// PATCH /api/admin/payments — Validate or reject a payment

export async function GET(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const provider = searchParams.get('provider') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (provider) where.provider = provider

    const payments = await db.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true, points: true, subscriptionTier: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Stats
    const stats = {
      pending: await db.payment.count({ where: { status: 'pending' } }),
      completed: await db.payment.count({ where: { status: 'completed' } }),
      failed: await db.payment.count({ where: { status: 'failed' } }),
      totalRevenue: await db.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }).then((r) => r._sum.amount || 0),
      whatsappPending: await db.payment.count({ where: { status: 'pending', provider: 'whatsapp' } }),
    }

    return NextResponse.json({ payments, stats })
  } catch (error) {
    console.error('[Admin Payments] GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { paymentId, action, adminNote } = body

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'paymentId et action requis' }, { status: 400 })
    }

    if (!['validate', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide (validate ou reject)' }, { status: 400 })
    }

    // Find the payment
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: `Ce paiement est déjà ${payment.status}` }, { status: 400 })
    }

    // ─── REJECT ───
    if (action === 'reject') {
      const updated = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'failed',
          adminNote: adminNote || 'Refusé par l\'administrateur',
          completedAt: new Date(),
        },
      })

      console.log(`[Admin] Payment rejected: ${payment.orderReference}`)
      return NextResponse.json({ payment: updated, action: 'rejected' })
    }

    // ─── VALIDATE — Credit user ───
    if (payment.type === 'points' && payment.tierIndex !== null) {
      const tier = POINTS_TIERS[payment.tierIndex]
      if (!tier) {
        return NextResponse.json({ error: 'Pack points introuvable' }, { status: 400 })
      }

      await db.user.update({
        where: { id: payment.userId },
        data: { points: { increment: tier.points } },
      })

      const updated = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          adminNote: adminNote || `Validé — ${tier.points} pts crédités`,
          providerTxId: payment.transactionId,
          completedAt: new Date(),
        },
      })

      console.log(`[Admin] Payment validated: ${payment.orderReference} — ${tier.points} pts for ${payment.user.name}`)

      return NextResponse.json({
        payment: updated,
        action: 'validated',
        credited: { type: 'points', amount: tier.points },
      })
    }

    if (payment.type === 'subscription' && payment.tierId) {
      const tier = SUBSCRIPTION_TIERS.find((t) => t.id === payment.tierId)
      if (!tier) {
        return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 400 })
      }

      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + tier.durationDays)

      await db.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionTier: tier.id,
          subscriptionStart: now.toISOString(),
          subscriptionEnd: endDate.toISOString(),
          points: { increment: tier.bonusPoints },
        },
      })

      const updated = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          adminNote: adminNote || `Validé — Abonnement ${tier.name} activé + ${tier.bonusPoints} pts`,
          providerTxId: payment.transactionId,
          completedAt: new Date(),
        },
      })

      console.log(`[Admin] Payment validated: ${payment.orderReference} — ${tier.name} for ${payment.user.name}`)

      return NextResponse.json({
        payment: updated,
        action: 'validated',
        credited: { type: 'subscription', tierId: tier.id, bonusPoints: tier.bonusPoints },
      })
    }

    return NextResponse.json({ error: 'Type de paiement invalide' }, { status: 400 })
  } catch (error) {
    console.error('[Admin Payments] PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
