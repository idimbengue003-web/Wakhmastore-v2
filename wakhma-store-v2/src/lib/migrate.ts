import { sql } from '@/lib/db'

let migrated = false

export async function autoMigrate() {
  if (migrated) return

  try {
    // Create User table
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL UNIQUE,
        "email" TEXT,
        "password" TEXT,
        "googleId" TEXT UNIQUE,
        "role" TEXT NOT NULL DEFAULT 'user',
        "userType" TEXT NOT NULL DEFAULT 'acheteur',
        "points" INTEGER NOT NULL DEFAULT 0,
        "subscriptionTier" TEXT,
        "subscriptionStart" TEXT,
        "subscriptionEnd" TEXT,
        "salesCount" INTEGER NOT NULL DEFAULT 0,
        "purchasesCount" INTEGER NOT NULL DEFAULT 0,
        "referralCode" TEXT UNIQUE,
        "referredBy" TEXT,
        "referralCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Add columns if they don't exist (safe ALTER)
    const userColumns = [
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType" TEXT NOT NULL DEFAULT 'acheteur'`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "purchasesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStart" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionEnd" TEXT`,
    ]
    for (const q of userColumns) {
      try { await sql(q) } catch { /* column exists */ }
    }

    // Create Demand table
    await sql`
      CREATE TABLE IF NOT EXISTS "Demand" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'Autre',
        "budget" INTEGER NOT NULL DEFAULT 0,
        "price" INTEGER NOT NULL DEFAULT 0,
        "quartier" TEXT NOT NULL DEFAULT 'Dakar',
        "urgency" TEXT NOT NULL DEFAULT 'flexible',
        "photo" TEXT,
        "whatsapp" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "annonceType" TEXT NOT NULL DEFAULT 'cherche',
        "expiresAt" TIMESTAMP(3),
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    const demandColumns = [
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "annonceType" TEXT NOT NULL DEFAULT 'cherche'`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3)`,
    ]
    for (const q of demandColumns) {
      try { await sql(q) } catch { /* column exists */ }
    }

    // Add foreign key if not exists
    try {
      await sql`ALTER TABLE "Demand" ADD CONSTRAINT "Demand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    } catch { /* constraint exists */ }

    // Create Reveal table
    await sql`
      CREATE TABLE IF NOT EXISTS "Reveal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "demandId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    try {
      await sql`ALTER TABLE "Reveal" ADD CONSTRAINT "Reveal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    } catch { /* exists */ }
    try {
      await sql`ALTER TABLE "Reveal" ADD CONSTRAINT "Reveal_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    } catch { /* exists */ }

    // Create Payment table
    await sql`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'XOF',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "sessionToken" TEXT,
        "orderReference" TEXT UNIQUE,
        "tierIndex" INTEGER,
        "tierId" TEXT,
        "provider" TEXT NOT NULL DEFAULT 'whatsapp',
        "providerTxId" TEXT,
        "netAmount" INTEGER,
        "fees" INTEGER,
        "metadata" TEXT,
        "senderPhone" TEXT,
        "senderName" TEXT,
        "transactionId" TEXT,
        "proofImageUrl" TEXT,
        "adminNote" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3)
      )
    `

    const paymentColumns = [
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "senderPhone" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "senderName" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "transactionId" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "proofImageUrl" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "adminNote" TEXT`,
    ]
    for (const q of paymentColumns) {
      try { await sql(q) } catch { /* column exists */ }
    }

    try {
      await sql`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    } catch { /* exists */ }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role")`,
      `CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier")`,
      `CREATE INDEX IF NOT EXISTS "User_googleId_idx" ON "User"("googleId")`,
      `CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "User"("referralCode")`,
      `CREATE INDEX IF NOT EXISTS "Demand_status_idx" ON "Demand"("status")`,
      `CREATE INDEX IF NOT EXISTS "Demand_category_idx" ON "Demand"("category")`,
      `CREATE INDEX IF NOT EXISTS "Demand_createdAt_idx" ON "Demand"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "Demand_annonceType_idx" ON "Demand"("annonceType")`,
      `CREATE INDEX IF NOT EXISTS "Demand_userId_idx" ON "Demand"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Demand_expiresAt_idx" ON "Demand"("expiresAt")`,
      `CREATE INDEX IF NOT EXISTS "Reveal_userId_idx" ON "Reveal"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Reveal_demandId_idx" ON "Reveal"("demandId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")`,
    ]
    for (const q of indexes) {
      try { await sql(q) } catch { /* exists */ }
    }

    // Update expired demands
    try {
      await sql`UPDATE "Demand" SET "expiresAt" = "createdAt" + INTERVAL '7 days' WHERE "expiresAt" IS NULL AND "status" = 'active'`
    } catch { /* no data */ }

    migrated = true
    console.log('[migrate] Auto-migration completed successfully')
  } catch (error) {
    console.error('[migrate] Auto-migration error:', error)
  }
}
