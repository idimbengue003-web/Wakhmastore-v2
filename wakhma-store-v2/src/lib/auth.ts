import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const JWT_SECRET: string = process.env.JWT_SECRET || 'wakhma-dev-secret-2024'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set in production — using insecure fallback. Set JWT_SECRET in Vercel environment variables!')
}

export interface JWTPayload {
  userId: string
  phone: string
  role: string
  name: string
  subscriptionTier?: string | null
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('wakhma_token')?.value
  if (!token) return null
  return verifyToken(token)
}
