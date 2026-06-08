import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '20'), 1), 50)

    const [demands, total] = await Promise.all([
      db.demand.findMany({
        include: { user: true, reveals: true },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      db.demand.count(),
    ])

    const hasMore = demands.length > limit
    const paginatedDemands = hasMore ? demands.slice(0, limit) : demands
    const nextCursor = hasMore ? paginatedDemands[paginatedDemands.length - 1].id : null

    return NextResponse.json({ demands: paginatedDemands, nextCursor, total })
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
