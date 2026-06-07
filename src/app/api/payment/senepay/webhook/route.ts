import { NextResponse } from 'next/server'

// ─── ROUTE DÉSACTIVÉE ───
// Les paiements SenePay ne sont plus auto-crédités.
// Tous les paiements doivent être validés manuellement par l'admin
// via le tableau de bord (onglet Paiements).
// Le mode test SenePay activait les abonnements automatiquement sans vrai paiement.
// Cette route est maintenant complètement bloquée.

export async function POST() {
  // Ne jamais auto-créditer — retourner 200 pour que SenePay ne réessaie pas
  console.warn('[SenePay] Webhook REJETÉ — auto-crédit désactivé. Utilisez la validation admin.')
  return NextResponse.json({ received: true, note: 'Auto-credit disabled. Admin validation required.' })
}

export async function GET() {
  return NextResponse.json({
    status: 'disabled',
    message: 'SenePay webhook auto-credit est désactivé. Tous les paiements doivent être validés par un administrateur.',
  })
}
