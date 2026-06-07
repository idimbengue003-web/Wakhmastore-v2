import { NextResponse } from 'next/server'

// DÉSACTIVÉ — Les points s'achètent via WhatsApp + validation admin
export async function POST() {
  return NextResponse.json(
    { error: 'Utilisez le paiement via WhatsApp pour acheter des points.' },
    { status: 403 }
  )
}
