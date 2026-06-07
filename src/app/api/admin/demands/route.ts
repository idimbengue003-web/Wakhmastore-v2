import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const demands = await db.demand.findMany({
      include: { user: true, reveals: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ demands })
  } catch (error) {
    console.error('Admin demands error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { demandId, status } = body

    if (!demandId || !status) {
      return NextResponse.json({ error: 'demandId et status requis' }, { status: 400 })
    }

    const demand = await db.demand.update({
      where: { id: demandId },
      data: { status },
    })

    return NextResponse.json({ demand })
  } catch (error) {
    console.error('Admin demands PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
