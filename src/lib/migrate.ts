import { db } from '@/lib/db'

let migrated = false

/**
 * Auto-migrate: ensure all required columns exist in the database.
 * Runs once per serverless cold start, then sets the `migrated` flag.
 * Uses ALTER TABLE ADD COLUMN for safe, idempotent migrations (SQLite compatible).
 */
export async function autoMigrate() {
  if (migrated) return

  try {
    // ─── User table columns ───
    const userColumns = [
      `ALTER TABLE "User" ADD COLUMN "userType" TEXT NOT NULL DEFAULT 'acheteur'`,
      `ALTER TABLE "User" ADD COLUMN "salesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN "purchasesCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT`,
      `ALTER TABLE "User" ADD COLUMN "subscriptionStart" TEXT`,
      `ALTER TABLE "User" ADD COLUMN "subscriptionEnd" TEXT`,
    ]
    for (const sql of userColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    // ─── Demand table columns ───
    const demandColumns = [
      `ALTER TABLE "Demand" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "Demand" ADD COLUMN "annonceType" TEXT NOT NULL DEFAULT 'cherche'`,
      `ALTER TABLE "Demand" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "Demand" ADD COLUMN "expiresAt" DATETIME`,
    ]
    for (const sql of demandColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    // ─── Set expiresAt for existing demands that don't have one ───
    try {
      await db.$executeRawUnsafe(`
        UPDATE "Demand"
        SET "expiresAt" = datetime("createdAt", '+7 days')
        WHERE "expiresAt" IS NULL AND "status" = 'active'
      `)
    } catch { /* no expired demands */ }

    // ─── Create Payment table if not exists ───
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
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" DATETIME
        )
      `)
    } catch { /* table exists */ }

    // ─── Payment table: WhatsApp Webhook Form columns ───
    const paymentColumns = [
      `ALTER TABLE "Payment" ADD COLUMN "senderPhone" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN "senderName" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN "transactionId" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN "proofImageUrl" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN "adminNote" TEXT`,
    ]
    for (const sql of paymentColumns) {
      try { await db.$executeRawUnsafe(sql) } catch { /* column exists */ }
    }

    // ─── Create indexes if they don't exist ───
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
