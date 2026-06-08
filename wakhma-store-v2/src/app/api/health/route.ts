import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL
  diagnostics.databaseUrlPrefix = dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET'
  diagnostics.databaseUrlProtocol = dbUrl ? dbUrl.split(':')[0] : 'NONE'

  // Check JWT_SECRET
  diagnostics.jwtSecretSet = !!process.env.JWT_SECRET

  // Check Node env
  diagnostics.nodeEnv = process.env.NODE_ENV

  // Try to connect to the database using Neon serverless
  try {
    const result = await sql`SELECT 1 as test`
    diagnostics.databaseConnection = result ? 'OK - PostgreSQL connected!' : 'FAILED - no result'
  } catch (error: unknown) {
    const err = error as Error
    diagnostics.databaseConnection = 'FAILED'
    diagnostics.databaseError = err.message
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
