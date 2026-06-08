// Simple sliding window rate limiter using in-memory Map
// For production with multiple serverless instances, you'd want to use Vercel KV or Redis
// But this works for single-instance deployment

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetTime }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetTime }
}

// Preset rate limiters
export const rateLimiters = {
  // Auth endpoints - strict
  login: (ip: string) => rateLimit(`login:${ip}`, 5, 15 * 60 * 1000), // 5 per 15 min
  register: (ip: string) => rateLimit(`register:${ip}`, 3, 60 * 60 * 1000), // 3 per hour
  // Write endpoints - moderate
  createDemand: (userId: string) => rateLimit(`demand:${userId}`, 10, 60 * 60 * 1000), // 10 per hour
  reveal: (userId: string) => rateLimit(`reveal:${userId}`, 30, 60 * 60 * 1000), // 30 per hour
  payment: (userId: string) => rateLimit(`payment:${userId}`, 5, 60 * 60 * 1000), // 5 per hour
  // General API
  api: (ip: string) => rateLimit(`api:${ip}`, 60, 60 * 1000), // 60 per minute
}
