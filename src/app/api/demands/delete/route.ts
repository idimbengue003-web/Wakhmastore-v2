import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Delete an annonce (owner only)
export async function POST(request: Request) {
  try {
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

    // Only the owner can delete (or admin)
    if (demand.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Tu ne peux supprimer que tes propres annonces' }, { status: 403 })
    }

    // Delete related reveals first
    await db.reveal.deleteMany({ where: { demandId } })

    // Delete the demand
    await db.demand.delete({ where: { id: demandId } })

    return NextResponse.json({ success: true, deletedId: demandId })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
