import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoMigrate } from '@/lib/migrate'

// ─── ROUTE MODIFIÉE ───
// Ne consulte plus SenePay pour confirmer les paiements automatiquement.
// Le mode test SenePay validait les paiements sans vrai transfert d'argent.
// Maintenant, seul l'admin peut valider un paiement via /api/admin/payments.
// Cette route retourne juste le statut enregistré en base de données.

export async function GET(request: Request) {
  try {
    await autoMigrate()

    const { searchParams } = new URL(request.url)
    const orderRef = searchParams.get('orderRef')

    if (!orderRef) {
      return NextResponse.json({ error: 'orderRef requis' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { orderReference: orderRef },
      select: {
        orderReference: true,
        status: true,
        type: true,
        amount: true,
        tierIndex: true,
        tierId: true,
        provider: true,
        providerTxId: true,
        sessionToken: true,
        createdAt: true,
        completedAt: true,
        adminNote: true,
        userId: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 })
    }

    // IMPORTANT: On ne consulte plus SenePay.
    // Le statut retourné est uniquement celui en base de données,
    // qui ne passe à "completed" QUE quand l'admin valide.
    return NextResponse.json(payment)
  } catch (error) {
    console.error('[Payment Status] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
