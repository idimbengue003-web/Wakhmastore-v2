import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoMigrate } from '@/lib/migrate'
import { POINTS_TIERS, SUBSCRIPTION_TIERS } from '@/lib/constants'

// WhatsApp Webhook Form: User submits payment proof after sending money via Wave
// Flow:
// 1. User sends money via Wave to the store's Wave number
// 2. User fills the proof form (transaction ID + screenshot optional)
// 3. This endpoint creates a Payment record with status "pending" and provider "whatsapp"
// 4. Admin validates in the dashboard → points/subscription credited

// Numéro Wave du store (à configurer via env)
const STORE_WAVE_NUMBER = process.env.STORE_WAVE_NUMBER || '771234567'
const STORE_WAVE_NAME = process.env.STORE_WAVE_NAME || 'Wakhma Store'

export async function POST(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const { type, tierIndex, tierId, senderPhone, senderName, transactionId, proofImageUrl } = body

    // ─── Validate payment type ───
    let amount = 0
    let label = ''
    let resolvedTierIndex: number | null = null
    let resolvedTierId: string | null = null

    if (type === 'points') {
      if (tierIndex < 0 || tierIndex >= POINTS_TIERS.length) {
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
      resolvedTierId = tierId
    } else {
      return NextResponse.json({ error: 'Type de paiement invalide' }, { status: 400 })
    }

    // ─── Validate proof fields ───
    if (!senderPhone || senderPhone.trim().length < 8) {
      return NextResponse.json({ error: 'Numéro de téléphone expéditeur requis' }, { status: 400 })
    }

    // Generate unique order reference
    const orderReference = `WK-WA-${Date.now()}-${session.userId.slice(0, 8)}`

    // ─── Create pending payment record ───
    const payment = await db.payment.create({
      data: {
        userId: session.userId,
        type,
        amount,
        currency: 'XOF',
        status: 'pending',
        orderReference,
        tierIndex: resolvedTierIndex,
        tierId: resolvedTierId,
        provider: 'whatsapp',
        senderPhone: senderPhone.trim(),
        senderName: senderName?.trim() || null,
        transactionId: transactionId?.trim() || null,
        proofImageUrl: proofImageUrl || null,
      },
    })

    console.log(`[WhatsApp Payment] Created pending: ${orderReference} - ${label} - ${amount} FCFA from ${senderPhone}`)

    // ─── Build WhatsApp confirmation link ───
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
      paymentId: payment.id,
      status: 'pending',
      amount,
      label,
      whatsappUrl,
      storeWaveNumber: STORE_WAVE_NUMBER,
      storeWaveName: STORE_WAVE_NAME,
      message: 'Votre preuve de paiement a été enregistrée. Un administrateur la vérifiera sous peu. Vous recevrez vos points/abonnement dès validation.',
    })
  } catch (error) {
    console.error('[WhatsApp Payment] Submit error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
