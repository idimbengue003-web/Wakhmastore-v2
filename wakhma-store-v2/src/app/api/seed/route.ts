import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, getSession } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    await db.$executeRawUnsafe(`
      UPDATE "Demand"
      SET "status" = 'expired'
      WHERE "status" = 'active'
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" < CURRENT_TIMESTAMP;
    `)

    const existing = await db.user.findUnique({ where: { phone: '770000000' } })
    if (existing) {
      return NextResponse.json({ message: 'Admin déjà créé', userId: existing.id })
    }

    const hashedPassword = hashPassword('wakhma2024')

    const admin = await db.user.create({
      data: {
        id: 'admin-seed-' + Date.now(),
        name: 'Admin Wakhma',
        phone: '770000000',
        password: hashedPassword,
        role: 'admin',
        points: 999999,
        salesCount: 0,
        purchasesCount: 0,
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Erreur lors de la création de l\'admin' }, { status: 500 })
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const demoDemands = [
      {
        title: 'Je cherche un iPhone 14 Pro Max',
        description: 'En bon état, avec chargeur. Couleur noire préférée. Budget serré mais négociable.',
        category: 'Téléphones',
        budget: 350000,
        quartier: 'Plateau',
        urgency: 'flexible',
        whatsapp: '771234567',
        userId: admin.id,
        expiresAt: sevenDaysFromNow,
      },
      {
        title: 'Je cherche un frigo Samsung double porte',
        description: 'Frigo Samsung ou LG double porte, pas trop vieux. Livraison si possible.',
        category: 'Frigo & Congélateur',
        budget: 200000,
        quartier: 'Médina',
        urgency: '1semaine',
        whatsapp: '772345678',
        userId: admin.id,
        expiresAt: sevenDaysFromNow,
      },
      {
        title: 'Je cherche un climatiseur split 12000 BTU',
        description: 'Climatiseur split pour chambre. Installation incluse si possible.',
        category: 'Climatiseur & Ventilateur',
        budget: 150000,
        quartier: 'Almadies',
        urgency: 'urgent',
        whatsapp: '773456789',
        userId: admin.id,
        expiresAt: sevenDaysFromNow,
      },
    ]

    for (const data of demoDemands) {
      await db.demand.create({ data: { ...data, id: 'demand-seed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) } })
    }

    return NextResponse.json({
      message: 'Base de données initialisée avec succès !',
      adminId: admin.id,
      demoDemands: demoDemands.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
