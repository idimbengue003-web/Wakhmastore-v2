import type { Metadata } from 'next'

// Force dynamic rendering — no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Recharger & Abonnements — Wakhma Store',
  description: 'Achète des points ou active un abonnement Diambar ou VIP KING',
}

export default function RechargeLayout({ children }: { children: React.ReactNode }) {
  return children
}
