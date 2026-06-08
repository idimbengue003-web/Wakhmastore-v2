import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL
  diagnostics.databaseUrlPrefix = dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET'
  diagnostics.databaseUrlProtocol = dbUrl ? dbUrl.split(':')[0] : 'NONE'

  // Check POSTGRES_URL_NON_POOLING
  const directUrl = process.env.POSTGRES_URL_NON_POOLING
  diagnostics.directUrlPrefix = directUrl ? directUrl.substring(0, 30) + '...' : 'NOT SET'

  // Check JWT_SECRET
  diagnostics.jwtSecretSet = !!process.env.JWT_SECRET

  // Check Node env
  diagnostics.nodeEnv = process.env.NODE_ENV

  // Try to connect to the database
  try {
    const { PrismaClient } = await import('@/generated/prisma')
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1 as test`
    diagnostics.databaseConnection = 'OK - PostgreSQL connected!'
    await prisma.$disconnect()
  } catch (error: unknown) {
    const err = error as Error
    diagnostics.databaseConnection = 'FAILED'
    diagnostics.databaseError = err.message
    diagnostics.databaseErrorStack = err.stack?.substring(0, 500)
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
