import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Recharger des points — Wakhma Store',
  description: 'Achète des points pour révéler les numéros WhatsApp',
}

export default function RechargeLayout({ children }: { children: React.ReactNode }) {
  return children
}
