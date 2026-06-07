import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// ─── ROUTE DÉSACTIVÉ ───
// Les paiements passent maintenant par WhatsApp + validation admin.
// Cette route est conservée pour compatibilité mais renvoie une erreur.
// Si SenePay est réactivé plus tard (KYC validé), décommenter le code ci-dessous.

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  return NextResponse.json(
    { error: 'Utilisez le paiement via WhatsApp pour commander. Cliquez sur le bouton vert sur la page Recharger.' },
    { status: 400 }
  )
}
