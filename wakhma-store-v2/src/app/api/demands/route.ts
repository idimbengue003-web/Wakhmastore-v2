import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maskPhonesInText, containsPhoneInText, maskPhone, VENDOR_ANNONCE_LIMITS } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'
import { rateLimiters } from '@/lib/rate-limit'
import { validateApi, createDemandSchema } from '@/lib/validations'
import type { Demand, User, Reveal } from '@/generated/prisma'

type DemandWithRelations = Demand & { user: User; reveals: Reveal[] }

export async function GET(request: Request) {
  try {
    await autoMigrate()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const annonceType = searchParams.get('annonceType')
    const quartierFilter = searchParams.get('quartier')
    const userId = searchParams.get('userId')
    const includeExpired = searchParams.get('includeExpired') === 'true'
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '20'), 1), 50)

    await db.demand.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    })

    const where: Record<string, unknown> = {}

    if (includeExpired) {
      where.status = { in: ['active', 'expired'] }
    } else if (userId) {
      where.userId = userId
    } else {
      where.status = 'active'
    }

    if (category && category !== 'Toutes') {
      where.category = category
    }

    if (annonceType) {
      where.annonceType = annonceType
    }

    if (quartierFilter && quartierFilter !== 'Tous') {
      where.quartier = quartierFilter
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [demands, total] = await Promise.all([
      db.demand.findMany({
        where,
        include: { user: true, reveals: true },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      db.demand.count({ where }),
    ])

    const hasMore = demands.length > limit
    const paginatedDemands = hasMore ? demands.slice(0, limit) : demands
    const nextCursor = hasMore ? paginatedDemands[paginatedDemands.length - 1].id : null

    const session = await getSession()

    const maskedDemands = (paginatedDemands as DemandWithRelations[]).map((d) => {
      const isOwner = session?.userId === d.userId
      const hasRevealed = d.reveals.some((r) => r.userId === session?.userId)

      return {
        id: d.id,
        title: d.title,
        description: isOwner ? d.description : maskPhonesInText(d.description),
        category: d.category,
        budget: d.budget,
        price: d.price,
        quartier: d.quartier,
        urgency: d.urgency,
        photo: d.photo,
        whatsapp: isOwner || hasRevealed ? d.whatsapp : maskPhone(d.whatsapp),
        whatsappRevealed: isOwner || hasRevealed,
        status: d.status,
        annonceType: d.annonceType || 'cherche',
        expiresAt: d.expiresAt?.toISOString() || null,
        createdAt: d.createdAt,
        userName: d.user.name,
        userSubscriptionTier: d.user.subscriptionTier,
        userType: d.user.userType || 'acheteur',
        userSalesCount: d.user.salesCount || 0,
        userPurchasesCount: d.user.purchasesCount || 0,
        hasPhoneInText: containsPhoneInText(d.description),
      }
    })

    return NextResponse.json({ demands: maskedDemands, nextCursor, total })
  } catch (error) {
    console.error('Demands GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // Rate limiting - 10 demands per hour per user
    const { success: demandAllowed } = rateLimiters.createDemand(session.userId)
    if (!demandAllowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Clean whatsapp before validation
    if (body.whatsapp && typeof body.whatsapp === 'string') {
      body.whatsapp = body.whatsapp.replace(/[\s+]/g, '').replace(/^221/, '')
    }

    const validation = validateApi(createDemandSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { title, description, category, budget, price, quartier, urgency, whatsapp, photo, annonceType } = validation.data

    if (containsPhoneInText(title) || containsPhoneInText(description)) {
      return NextResponse.json(
        { error: 'Les numéros de téléphone ne sont pas autorisés dans le titre ou la description.' },
        { status: 400 }
      )
    }

    const isVente = annonceType === 'vends'

    if (isVente) {
      const user = await db.user.findUnique({ where: { id: session.userId } })
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }

      if (user.userType !== 'vendeur') {
        return NextResponse.json(
          { error: 'Seuls les vendeurs peuvent poster des annonces "Je vends"' },
          { status: 403 }
        )
      }

      const subTier = user.subscriptionTier || 'none'
      const maxAnnonces = VENDOR_ANNONCE_LIMITS[subTier] ?? 0

      if (maxAnnonces === 0) {
        return NextResponse.json(
          { error: 'Vendeur simple : tu ne peux pas poster d\'annonces. Prends un abonnement Diambar 💎 ou VIP KING ⭐ pour poster jusqu\'à 3 annonces !' },
          { status: 403 }
        )
      }

      const activeVentes = await db.demand.count({
        where: {
          userId: session.userId,
          annonceType: 'vends',
          status: 'active',
        },
      })

      if (activeVentes >= maxAnnonces) {
        return NextResponse.json(
          { error: `Limite de ${maxAnnonces} annonces "Je vends" atteinte. Supprime une annonce ou passe en VIP KING !` },
          { status: 400 }
        )
      }
    }

    if (!isVente) {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const weeklyCount = await db.demand.count({
        where: {
          userId: session.userId,
          createdAt: { gte: oneWeekAgo },
          annonceType: 'cherche',
        },
      })

      if (weeklyCount >= 3) {
        return NextResponse.json(
          { error: 'Limite de 3 annonces par semaine atteinte.' },
          { status: 400 }
        )
      }
    }

    const prefix = isVente ? 'Je vends' : 'Je cherche'
    const fullTitle = title.startsWith(prefix) ? title : `${prefix} ${title}`

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const demand = await db.demand.create({
      data: {
        title: fullTitle,
        description,
        category,
        budget,
        price,
        quartier,
        urgency,
        whatsapp,
        photo: photo || null,
        annonceType: isVente ? 'vends' : 'cherche',
        status: 'active',
        expiresAt,
        userId: session.userId,
      },
    })

    return NextResponse.json({ demand }, { status: 201 })
  } catch (error) {
    console.error('Demands POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
