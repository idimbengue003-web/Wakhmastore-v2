import { db } from '@/lib/db'

let migrated = false

export async function autoMigrate() {
  if (migrated) return

  try {
    const userColumns = [
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType" TEXT NOT NULL DEFAULT 'acheteur'`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "purchasesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStart" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionEnd" TEXT`,
    ]
    for (const sql of userColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    const demandColumns = [
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "annonceType" TEXT NOT NULL DEFAULT 'cherche'`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "Demand" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3)`,
    ]
    for (const sql of demandColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    try {
      await db.$executeRawUnsafe(`
        UPDATE "Demand"
        SET "expiresAt" = "createdAt" + INTERVAL '7 days'
        WHERE "expiresAt" IS NULL AND "status" = 'active'
      `)
    } catch { /* no expired demands */ }

    try {
      await db.$executeRawUnsafe(`
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
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3)
        )
      `)
    } catch { /* table exists */ }

    const paymentColumns = [
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "senderPhone" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "senderName" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "transactionId" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "proofImageUrl" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "adminNote" TEXT`,
    ]
    for (const sql of paymentColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    const indexes = [
      `CREATE INDEX IF NOT EXISTS "Demand_userId_idx" ON "Demand"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Demand_expiresAt_idx" ON "Demand"("expiresAt")`,
      `CREATE INDEX IF NOT EXISTS "Demand_annonceType_idx" ON "Demand"("annonceType")`,
      `CREATE INDEX IF NOT EXISTS "Reveal_userId_idx" ON "Reveal"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Reveal_demandId_idx" ON "Reveal"("demandId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Payment_orderReference_idx" ON "Payment"("orderReference")`,
      `CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")`,
    ]
    for (const sql of indexes) {
      try { await db.$executeRawUnsafe(sql) } catch { /* index exists */ }
    }

    migrated = true
    console.log('[migrate] Auto-migration completed successfully')
  } catch (error) {
    console.error('[migrate] Auto-migration error:', error)
  }
}
