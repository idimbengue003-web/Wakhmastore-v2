import { NextResponse } from 'next/server'
import { db, sql } from '@/lib/db'
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
        take: limit + 1,
        skip: cursor ? 1 : 0,
      }),
      db.user.count(),
    ])

    // Add demand and reveal counts for each user
    const usersWithCounts = await Promise.all(users.map(async (u) => {
      const [demandCount, revealCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM "Demand" WHERE "userId" = ${u.id}`.then(r => (r as any)[0]?.count || 0),
        sql`SELECT COUNT(*) as count FROM "Reveal" WHERE "userId" = ${u.id}`.then(r => (r as any)[0]?.count || 0),
      ])
      return {
        ...u,
        _count: { demands: Number(demandCount), reveals: Number(revealCount) },
      }
    }))

    const hasMore = usersWithCounts.length > limit
    const paginatedUsers = hasMore ? usersWithCounts.slice(0, limit) : usersWithCounts
    const nextCursor = hasMore ? paginatedUsers[paginatedUsers.length - 1].id : null

    return NextResponse.json({ users: paginatedUsers, nextCursor, total })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
