import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maskPhonesInText, containsPhoneInText, maskPhone, VENDOR_ANNONCE_LIMITS } from '@/lib/constants'
import { autoMigrate } from '@/lib/migrate'
import type { Demand, User, Reveal } from '@prisma/client'

type DemandWithRelations = Demand & { user: User; reveals: Reveal[] }

export async function GET(request: Request) {
  try {
    await autoMigrate()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const annonceType = searchParams.get('annonceType')
    const userId = searchParams.get('userId')
    const includeExpired = searchParams.get('includeExpired') === 'true'
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Auto-expire annonces that are past their expiresAt
    await db.demand.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    })

    const where: Record<string, unknown> = {}

    // By default, only show active (non-expired, non-sold) annonces
    if (includeExpired) {
      where.status = { in: ['active', 'expired'] }
    } else if (userId) {
      // User's own annonces: show all statuses
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

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const demands = await db.demand.findMany({
      where,
      include: { user: true, reveals: true },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    })

    const session = await getSession()

    const maskedDemands = (demands as DemandWithRelations[]).map((d) => {
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

    return NextResponse.json({ demands: maskedDemands })
  } catch (error) {
    console.error('Demands GET error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erreur serveur', detail: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await autoMigrate()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, budget, price, quartier, urgency, whatsapp, photo, annonceType } = body

    if (!title || !description || !whatsapp) {
      return NextResponse.json(
        { error: 'Titre, description et WhatsApp requis' },
        { status: 400 }
      )
    }

    // Check for phone numbers in text
    if (containsPhoneInText(title) || containsPhoneInText(description)) {
      return NextResponse.json(
        { error: 'Les numéros de téléphone ne sont pas autorisés dans le titre ou la description.' },
        { status: 400 }
      )
    }

    const isVente = annonceType === 'vends'

    // ─── Vendeur posting "Je vends" : check subscription ───
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

      // Count active "Je vends" annonces
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

    // ─── Acheteur posting "Je cherche" : 3 per week limit ───
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

    // Prefix title
    const prefix = isVente ? 'Je vends' : 'Je cherche'
    const fullTitle = title.startsWith(prefix) ? title : `${prefix} ${title}`

    // Set expiration: 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const demand = await db.demand.create({
      data: {
        title: fullTitle,
        description,
        category: category || 'Autre',
        budget: budget || 0,
        price: price || 0,
        quartier: quartier || 'Dakar',
        urgency: urgency || 'flexible',
        whatsapp: whatsapp.replace(/\s/g, ''),
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
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erreur serveur', detail: msg }, { status: 500 })
  }
}
