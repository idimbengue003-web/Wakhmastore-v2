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

    const [users, total] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          points: true,
          subscriptionTier: true,
          createdAt: true,
          _count: {
            select: { demands: true, reveals: true },
          },
        },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      db.user.count(),
    ])

    const hasMore = users.length > limit
    const paginatedUsers = hasMore ? users.slice(0, limit) : users
    const nextCursor = hasMore ? paginatedUsers[paginatedUsers.length - 1].id : null

    return NextResponse.json({ users: paginatedUsers, nextCursor, total })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
