import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  phone: z.string().regex(/^7[0-9]{8}$/, 'Numéro de téléphone invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
  phone: z.string().regex(/^7[0-9]{8}$/, 'Numéro de téléphone invalide'),
  password: z.string().min(4, 'Mot de passe trop court (min 4)').max(100, 'Mot de passe trop long'),
  userType: z.enum(['vendeur', 'acheteur']),
  referralCode: z.string().optional(),
})

// Demand schemas
export const createDemandSchema = z.object({
  title: z.string().min(3, 'Titre trop court').max(100, 'Titre trop long'),
  description: z.string().min(10, 'Description trop courte').max(2000, 'Description trop longue'),
  category: z.string().min(1, 'Catégorie requise'),
  budget: z.number().int().min(0).max(100000000).optional().default(0),  // max 100M FCFA
  price: z.number().int().min(0).max(100000000).optional().default(0),
  quartier: z.string().min(1, 'Quartier requis').max(50),
  urgency: z.enum(['urgent', '2jours', '1semaine', 'flexible']),
  annonceType: z.enum(['vends', 'cherche']),
  photo: z.string().url('URL de photo invalide').optional().nullable(),
  whatsapp: z.string().regex(/^7[0-9]{8}$/, 'Numéro WhatsApp invalide'),
})

export const renewDemandSchema = z.object({
  demandId: z.string().min(1, 'ID requis'),
})

export const soldDemandSchema = z.object({
  demandId: z.string().min(1, 'ID requis'),
})

export const deleteDemandSchema = z.object({
  demandId: z.string().min(1, 'ID requis'),
})

// Reveal schema
export const revealSchema = z.object({
  demandId: z.string().min(1, 'ID requis'),
})

// Payment schemas
export const whatsappPaymentSchema = z.object({
  type: z.enum(['points', 'subscription']),
  amount: z.number().int().min(500, 'Montant minimum 500 FCFA').max(100000, 'Montant maximum 100 000 FCFA'),
  senderPhone: z.string().regex(/^7[0-9]{8}$/, 'Numéro invalide'),
  tierIndex: z.number().int().min(0).optional(),
  tierId: z.string().optional(),
})

// Admin schemas
export const adminPaymentActionSchema = z.object({
  paymentId: z.string().min(1, 'ID requis'),
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().max(500).optional(),
})

export const adminDemandActionSchema = z.object({
  demandId: z.string().min(1, 'ID requis'),
  action: z.enum(['reject', 'reactivate']),
})

export const adminCreditSchema = z.object({
  userId: z.string().min(1, 'ID utilisateur requis'),
  points: z.number().int().min(1, 'Minimum 1 point').max(1000000, 'Maximum 1 000 000 points'),
  subscriptionTier: z.enum(['diambar', 'king']).optional(),
  subscriptionDays: z.number().int().min(1).max(365).optional(),
})

// Helper to validate and return typed data or error
export function validateApi<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstError = result.error.issues[0]
  return { success: false, error: firstError?.message || 'Données invalides' }
}
