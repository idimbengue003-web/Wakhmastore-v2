import { NextResponse } from 'next/server'

// DÉSACTIVÉ — Les abonnements s'activent via WhatsApp + validation admin
export async function POST() {
  return NextResponse.json(
    { error: 'Utilisez le paiement via WhatsApp pour activer un abonnement.' },
    { status: 403 }
  )
}
