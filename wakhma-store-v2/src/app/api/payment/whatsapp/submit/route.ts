import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoMigrate } from '@/lib/migrate'
import { POINTS_TIERS, SUBSCRIPTION_TIERS } from '@/lib/constants'
import { rateLimiters } from '@/lib/rate-limit'
import { validateApi, whatsappPaymentSchema } from '@/lib/validations'

const STORE_WAVE_NUMBER = process.env.STORE_WAVE_NUMBER || '771234567'
const STORE_WAVE_NAME = process.env.STORE_WAVE_NAME || 'Wakhma Store'

export async function POST(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // Rate limiting - 5 payment submissions per hour per user
    const { success: paymentAllowed } = rateLimiters.payment(session.userId)
    if (!paymentAllowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Clean senderPhone before validation
    if (body.senderPhone && typeof body.senderPhone === 'string') {
      body.senderPhone = body.senderPhone.replace(/[\s+]/g, '').replace(/^221/, '')
    }

    const validation = validateApi(whatsappPaymentSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { type, tierIndex, tierId, senderPhone } = validation.data
    const { senderName, transactionId, proofImageUrl } = body as Record<string, unknown>

    let amount = 0
    let label = ''
    let resolvedTierIndex: number | null = null
    let resolvedTierId: string | null = null

    if (type === 'points') {
      if (tierIndex === undefined || tierIndex < 0 || tierIndex >= POINTS_TIERS.length) {
        return NextResponse.json({ error: 'Pack invalide' }, { status: 400 })
      }
      const tier = POINTS_TIERS[tierIndex]
      amount = tier.prix
      label = `${tier.points} pts - ${tier.label}`
      resolvedTierIndex = tierIndex
    } else if (type === 'subscription') {
      const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId)
      if (!tier) {
        return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 })
      }
      amount = tier.price
      label = `Abonnement ${tier.name}`
      resolvedTierId = tierId ?? null
    }

    const orderReference = `WK-WA-${Date.now()}-${session.userId.slice(0, 8)}`

    const payment = await db.payment.create({
      data: {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
        userId: session.userId,
        type,
        amount,
        currency: 'XOF',
        status: 'pending',
        orderReference,
        tierIndex: resolvedTierIndex,
        tierId: resolvedTierId,
        provider: 'whatsapp',
        senderPhone: senderPhone.trim ? senderPhone.trim() : senderPhone,
        senderName: typeof senderName === 'string' ? senderName.trim() : null,
        transactionId: typeof transactionId === 'string' ? transactionId.trim() : null,
        proofImageUrl: typeof proofImageUrl === 'string' ? proofImageUrl : null,
      },
    })

    console.log(`[WhatsApp Payment] Created pending: ${orderReference} - ${label} - ${amount} FCFA from ${senderPhone}`)

    const whatsappMessage = encodeURIComponent(
      `🔔 *Nouveau paiement Wakhma Store*\n\n` +
      `📋 Référence: ${orderReference}\n` +
      `💰 Montant: ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA\n` +
      `📦 Type: ${label}\n` +
      `📱 Expéditeur: ${senderPhone}${senderName ? ` (${senderName})` : ''}\n` +
      `🔑 ID Transaction: ${transactionId || 'Non fourni'}\n\n` +
      `✅ Je confirme avoir envoyé ce paiement via Wave`
    )
    const whatsappUrl = `https://wa.me/${STORE_WAVE_NUMBER.replace(/\s/g, '')}?text=${whatsappMessage}`

    return NextResponse.json({
      success: true,
      orderReference,
      paymentId: payment?.id || orderReference,
      status: 'pending',
      amount,
      label,
      whatsappUrl,
      storeWaveNumber: STORE_WAVE_NUMBER,
      storeWaveName: STORE_WAVE_NAME,
      message: 'Votre preuve de paiement a été enregistrée. Un administrateur la vérifiera sous peu.',
    })
  } catch (error) {
    console.error('[WhatsApp Payment] Submit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
