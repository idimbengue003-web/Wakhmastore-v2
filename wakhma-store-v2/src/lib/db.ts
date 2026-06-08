import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// ═══════════════════════════════════════════════════════════════
// Neon Serverless Database Client — replaces Prisma entirely
// No schema, no generate, no cache issues on Vercel
// ═══════════════════════════════════════════════════════════════

let _sql: ReturnType<typeof neon> | null = null
let _sqlQuery: ((query: string, params?: unknown[]) => Promise<unknown[]>) | null = null

function getSql() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!)
    _sqlQuery = (_sql as any).query || _sql
  }
  return { sql: _sql!, sqlQuery: _sqlQuery! }
}

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  apply(_target, _thisArg, args) {
    return getSql().sql(...args as [TemplateStringsArray, ...unknown[]])
  },
  get(_target, prop) {
    const s = getSql().sql
    const val = (s as any)[prop]
    return typeof val === 'function' ? val.bind(s) : val
  },
})

export const sqlQuery = new Proxy(((query: string, params?: unknown[]) => Promise.resolve([])) as (query: string, params?: unknown[]) => Promise<unknown[]>, {
  apply(_target, _thisArg, args) {
    return getSql().sqlQuery(args[0] as string, args[1] as unknown[])
  },
})

// ─── Type definitions ─────────────────────────────────────────

export interface DBUser {
  id: string
  name: string
  phone: string
  email: string | null
  password: string | null
  googleId: string | null
  role: string
  userType: string
  points: number
  subscriptionTier: string | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  salesCount: number
  purchasesCount: number
  referralCode: string | null
  referredBy: string | null
  referralCount: number
  createdAt: string
}

export interface DBDemand {
  id: string
  title: string
  description: string
  category: string
  budget: number
  price: number
  quartier: string
  urgency: string
  photo: string | null
  whatsapp: string
  status: string
  annonceType: string
  expiresAt: string | null
  userId: string
  createdAt: string
}

export interface DBReveal {
  id: string
  userId: string
  demandId: string
  createdAt: string
}

export interface DBPayment {
  id: string
  userId: string
  type: string
  amount: number
  currency: string
  status: string
  sessionToken: string | null
  orderReference: string | null
  tierIndex: number | null
  tierId: string | null
  provider: string
  providerTxId: string | null
  netAmount: number | null
  fees: number | null
  metadata: string | null
  senderPhone: string | null
  senderName: string | null
  transactionId: string | null
  proofImageUrl: string | null
  adminNote: string | null
  createdAt: string
  completedAt: string | null
}

// ─── Database client with Prisma-like API ─────────────────────

export const db = {
  // ─── Raw SQL access ───────────────────────────────────────
  $queryRawUnsafe: async (query: string) => sqlQuery(query),
  $executeRawUnsafe: async (query: string) => { await sqlQuery(query) },
  $transaction: async (queries: Promise<unknown>[]) => Promise.all(queries),

  // ─── User operations ──────────────────────────────────────
  user: {
    findUnique: async ({ where, include, select }: { where: { id?: string; phone?: string; googleId?: string; email?: string; referralCode?: string }; include?: boolean | Record<string, any>; select?: boolean | Record<string, any> }) => {
      if (where.id) return getOne<DBUser>('SELECT * FROM "User" WHERE id = $1', [where.id])
      if (where.phone) return getOne<DBUser>('SELECT * FROM "User" WHERE phone = $1', [where.phone])
      if (where.googleId) return getOne<DBUser>('SELECT * FROM "User" WHERE "googleId" = $1', [where.googleId])
      if (where.email) return getOne<DBUser>('SELECT * FROM "User" WHERE email = $1', [where.email])
      if (where.referralCode) return getOne<DBUser>('SELECT * FROM "User" WHERE "referralCode" = $1', [where.referralCode])
      return null
    },

    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const conditions: string[] = []
      const values: unknown[] = []
      let idx = 1
      for (const [key, val] of Object.entries(where)) {
        conditions.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }
      const query = `SELECT * FROM "User" WHERE ${conditions.join(' AND ')} LIMIT 1`
      return getOne<DBUser>(query, values)
    },

    findMany: async ({ where, orderBy, take, skip, select }: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; skip?: number; select?: Record<string, boolean> } = {}) => {
      let query = 'SELECT * FROM "User"'
      const values: unknown[] = []
      let idx = 1

      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        for (const [key, val] of Object.entries(where)) {
          if (val && typeof val === 'object' && 'in' in (val as object)) {
            const vals = (val as { in: unknown[] }).in
            const placeholders = vals.map((v) => `$${idx++}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...vals)
          } else {
            conditions.push(`"${key}" = $${idx}`)
            values.push(val)
            idx++
          }
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0]
        query += ` ORDER BY "${field}" ${direction === 'desc' ? 'DESC' : 'ASC'}`
      }

      if (take) query += ` LIMIT ${take}`
      if (skip) query += ` OFFSET ${skip}`

      return getAll<DBUser>(query, values)
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const colNames = keys.map(k => `"${k}"`).join(', ')
      const query = `INSERT INTO "User" (${colNames}) VALUES (${placeholders}) RETURNING *`
      return getOne<DBUser>(query, values)
    },

    update: async ({ where, data }: { where: { id?: string; phone?: string }; data: Record<string, unknown> }) => {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && 'increment' in (val as object)) {
          sets.push(`"${key}" = "${key}" + $${idx}`)
          values.push((val as { increment: number }).increment)
        } else if (val && typeof val === 'object' && 'decrement' in (val as object)) {
          sets.push(`"${key}" = "${key}" - $${idx}`)
          values.push((val as { decrement: number }).decrement)
        } else {
          sets.push(`"${key}" = $${idx}`)
          values.push(val)
        }
        idx++
      }

      const whereKey = Object.keys(where)[0]
      const whereVal = Object.values(where)[0]
      const query = `UPDATE "User" SET ${sets.join(', ')} WHERE "${whereKey}" = $${idx} RETURNING *`
      values.push(whereVal)

      return getOne<DBUser>(query, values)
    },

    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      for (const [key, val] of Object.entries(data)) {
        sets.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }

      const conditions: string[] = []
      if (where && Object.keys(where).length > 0) {
        for (const [key, val] of Object.entries(where)) {
          if (val && typeof val === 'object' && 'lt' in (val as object)) {
            conditions.push(`"${key}" < $${idx}`)
            values.push((val as { lt: unknown }).lt)
          } else if (val && typeof val === 'object' && 'not' in (val as object)) {
            conditions.push(`"${key}" IS NOT NULL`)
            // skip adding value since IS NOT NULL doesn't need a parameter
          } else if (val && typeof val === 'object' && 'gte' in (val as object)) {
            conditions.push(`"${key}" >= $${idx}`)
            values.push((val as { gte: unknown }).gte)
          } else {
            conditions.push(`"${key}" = $${idx}`)
            values.push(val)
          }
          idx++
        }
      }

      const queryStr = `UPDATE "User" SET ${sets.join(', ')}${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`
      await sqlQuery(queryStr, values)
      return { count: 0 } // approximate, updateMany doesn't easily return count with raw SQL
    },

    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let query = 'SELECT COUNT(*) as count FROM "User"'
      const values: unknown[] = []
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        let idx = 1
        for (const [key, val] of Object.entries(where)) {
          conditions.push(`"${key}" = $${idx}`)
          values.push(val)
          idx++
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }
      const result = await getOne<{ count: number }>(query, values)
      return result?.count || 0
    },

    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const conditions: string[] = []
      const values: unknown[] = []
      let idx = 1
      for (const [key, val] of Object.entries(where)) {
        conditions.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }
      await sqlQuery(`DELETE FROM "User" WHERE ${conditions.join(' AND ')}`, values)
    },
  },

  // ─── Demand operations ────────────────────────────────────
  demand: {
    findUnique: async ({ where, include }: { where: { id?: string }; include?: Record<string, boolean> }) => {
      if (include?.user || include?.reveals) {
        const demand = await getOne<DBDemand>('SELECT * FROM "Demand" WHERE id = $1', [where.id])
        if (!demand) return null
        const result: Record<string, unknown> = { ...demand }

        if (include?.user) {
          result.user = await getOne<DBUser>('SELECT * FROM "User" WHERE id = $1', [demand.userId])
        }
        if (include?.reveals) {
          result.reveals = await getAll<DBReveal>('SELECT * FROM "Reveal" WHERE "demandId" = $1', [demand.id])
        }
        return result
      }
      return getOne<DBDemand>('SELECT * FROM "Demand" WHERE id = $1', [where.id])
    },

    findMany: async ({ where, include, orderBy, take, skip, cursor }: { where?: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; take?: number; skip?: number; cursor?: { id: string } } = {}) => {
      let query = 'SELECT * FROM "Demand"'
      const values: unknown[] = []
      let idx = 1

      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        for (const [key, val] of Object.entries(where)) {
          if (val && typeof val === 'object' && 'in' in (val as object)) {
            const vals = (val as { in: unknown[] }).in
            const placeholders = vals.map((v) => `$${idx++}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...vals)
          } else if (val && typeof val === 'object' && 'lt' in (val as object)) {
            conditions.push(`"${key}" < $${idx}`)
            values.push((val as { lt: unknown }).lt)
            idx++
          } else if (val && typeof val === 'object' && 'gte' in (val as object)) {
            conditions.push(`"${key}" >= $${idx}`)
            values.push((val as { gte: unknown }).gte)
            idx++
          } else if (val && typeof val === 'object' && 'contains' in (val as object)) {
            conditions.push(`"${key}" ILIKE $${idx}`)
            values.push(`%${(val as { contains: string }).contains}%`)
            idx++
          } else {
            conditions.push(`"${key}" = $${idx}`)
            values.push(val)
            idx++
          }
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      if (cursor) {
        query += where ? ' AND' : ' WHERE'
        query += ` id > $${idx}`
        values.push(cursor.id)
        idx++
      }

      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0]
        query += ` ORDER BY "${field}" ${direction === 'desc' ? 'DESC' : 'ASC'}`
      } else {
        query += ' ORDER BY "createdAt" DESC'
      }

      if (take) query += ` LIMIT ${take}`
      if (skip) query += ` OFFSET ${skip}`

      const demands = await getAll<DBDemand>(query, values)

      if (include?.user || include?.reveals) {
        return Promise.all(demands.map(async (d) => {
          const result: Record<string, unknown> = { ...d }
          if (include?.user) {
            result.user = await getOne<DBUser>('SELECT * FROM "User" WHERE id = $1', [d.userId])
          }
          if (include?.reveals) {
            result.reveals = await getAll<DBReveal>('SELECT * FROM "Reveal" WHERE "demandId" = $1', [d.id])
          }
          return result
        }))
      }

      return demands
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const colNames = keys.map(k => `"${k}"`).join(', ')
      const query = `INSERT INTO "Demand" (${colNames}) VALUES (${placeholders}) RETURNING *`
      return getOne<DBDemand>(query, values)
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && 'increment' in (val as object)) {
          sets.push(`"${key}" = "${key}" + $${idx}`)
          values.push((val as { increment: number }).increment)
        } else if (val && typeof val === 'object' && 'decrement' in (val as object)) {
          sets.push(`"${key}" = "${key}" - $${idx}`)
          values.push((val as { decrement: number }).decrement)
        } else {
          sets.push(`"${key}" = $${idx}`)
          values.push(val)
        }
        idx++
      }

      const query = `UPDATE "Demand" SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`
      values.push(where.id)
      return getOne<DBDemand>(query, values)
    },

    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      for (const [key, val] of Object.entries(data)) {
        sets.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }

      const conditions: string[] = []
      for (const [key, val] of Object.entries(where)) {
        if (val && typeof val === 'object' && 'lt' in (val as object)) {
          conditions.push(`"${key}" < $${idx}`)
          values.push((val as { lt: unknown }).lt)
        } else {
          conditions.push(`"${key}" = $${idx}`)
          values.push(val)
        }
        idx++
      }

      const query = `UPDATE "Demand" SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')}`
      await sqlQuery(query, values)
    },

    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let query = 'SELECT COUNT(*) as count FROM "Demand"'
      const values: unknown[] = []
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        let idx = 1
        for (const [key, val] of Object.entries(where)) {
          if (val && typeof val === 'object' && 'gte' in (val as object)) {
            conditions.push(`"${key}" >= $${idx}`)
            values.push((val as { gte: unknown }).gte)
          } else if (val && typeof val === 'object' && 'in' in (val as object)) {
            const vals = (val as { in: unknown[] }).in
            const placeholders = vals.map((v) => `$${idx++}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...vals)
          } else {
            conditions.push(`"${key}" = $${idx}`)
            values.push(val)
          }
          idx++
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }
      const result = await getOne<{ count: number }>(query, values)
      return result?.count || 0
    },

    delete: async ({ where }: { where: { id: string } }) => {
      await sqlQuery('DELETE FROM "Demand" WHERE id = $1', [where.id])
    },
  },

  // ─── Reveal operations ────────────────────────────────────
  reveal: {
    create: async ({ data }: { data: { userId: string; demandId: string } }) => {
      return getOne<DBReveal>(
        'INSERT INTO "Reveal" (id, "userId", "demandId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW()) RETURNING *',
        [data.userId, data.demandId]
      )
    },

    findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      const conditions: string[] = []
      const values: unknown[] = []
      let idx = 1
      if (where) {
        for (const [key, val] of Object.entries(where)) {
          conditions.push(`"${key}" = $${idx}`)
          values.push(val)
          idx++
        }
      }
      const query = `SELECT * FROM "Reveal"${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`
      return getAll<DBReveal>(query, values)
    },

    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const conditions: string[] = []
      const values: unknown[] = []
      let idx = 1
      for (const [key, val] of Object.entries(where)) {
        conditions.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }
      await sqlQuery(`DELETE FROM "Reveal" WHERE ${conditions.join(' AND ')}`, values)
    },
  },

  // ─── Payment operations ───────────────────────────────────
  payment: {
    findUnique: async ({ where, include }: { where: { id?: string; orderReference?: string }; include?: Record<string, unknown> }) => {
      let payment: DBPayment | null = null
      if (where.id) payment = await getOne<DBPayment>('SELECT * FROM "Payment" WHERE id = $1', [where.id])
      else if (where.orderReference) payment = await getOne<DBPayment>('SELECT * FROM "Payment" WHERE "orderReference" = $1', [where.orderReference])

      if (!payment) return null
      if (!include?.user) return payment

      const user = await getOne<DBUser>('SELECT * FROM "User" WHERE id = $1', [payment.userId])
      return { ...payment, user }
    },

    findMany: async ({ where, orderBy, take, skip, cursor, include }: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; skip?: number; cursor?: { id: string }; include?: Record<string, unknown> } = {}) => {
      let query = 'SELECT * FROM "Payment"'
      const values: unknown[] = []
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        let idx = 1
        for (const [key, val] of Object.entries(where)) {
          if (val && typeof val === 'object' && 'in' in (val as object)) {
            const vals = (val as { in: unknown[] }).in
            const placeholders = vals.map((v) => `$${idx++}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...vals)
          } else {
            conditions.push(`"${key}" = $${idx}`)
            values.push(val)
            idx++
          }
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0]
        query += ` ORDER BY "${field}" ${direction === 'desc' ? 'DESC' : 'ASC'}`
      } else {
        query += ' ORDER BY "createdAt" DESC'
      }
      if (take) query += ` LIMIT ${take}`
      if (skip) query += ` OFFSET ${skip}`

      const payments = await getAll<DBPayment>(query, values)

      if (include?.user) {
        return Promise.all(payments.map(async (p) => {
          const user = await getOne<DBUser>('SELECT * FROM "User" WHERE id = $1', [p.userId])
          return { ...p, user }
        }))
      }

      return payments
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const colNames = keys.map(k => `"${k}"`).join(', ')
      const query = `INSERT INTO "Payment" (${colNames}) VALUES (${placeholders}) RETURNING *`
      return getOne<DBPayment>(query, values)
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const sets: string[] = []
      const values: unknown[] = []
      let idx = 1

      for (const [key, val] of Object.entries(data)) {
        sets.push(`"${key}" = $${idx}`)
        values.push(val)
        idx++
      }

      const query = `UPDATE "Payment" SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`
      values.push(where.id)
      return getOne<DBPayment>(query, values)
    },

    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let query = 'SELECT COUNT(*) as count FROM "Payment"'
      const values: unknown[] = []
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        let idx = 1
        for (const [key, val] of Object.entries(where)) {
          conditions.push(`"${key}" = $${idx}`)
          values.push(val)
          idx++
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }
      const result = await getOne<{ count: number }>(query, values)
      return result?.count || 0
    },

    aggregate: async ({ where, _sum }: { where?: Record<string, unknown>; _sum?: Record<string, boolean> }) => {
      const sumField = _sum ? Object.keys(_sum)[0] : 'amount'
      let query = `SELECT SUM("${sumField}") as total FROM "Payment"`
      const values: unknown[] = []
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = []
        let idx = 1
        for (const [key, val] of Object.entries(where)) {
          conditions.push(`"${key}" = $${idx}`)
          values.push(val)
          idx++
        }
        query += ` WHERE ${conditions.join(' AND ')}`
      }
      const result = await getOne<{ total: number | null }>(query, values)
      return { _sum: { [sumField]: result?.total || 0 } }
    },
  },
}

// ─── Helper functions ─────────────────────────────────────────

async function getOne<T>(query: string, params: unknown[] = []): Promise<T | null> {
  const rows = await sqlQuery(query, params)
  return (rows as T[])[0] || null
}

async function getAll<T>(query: string, params: unknown[] = []): Promise<T[]> {
  return sqlQuery(query, params) as Promise<T[]>
}
