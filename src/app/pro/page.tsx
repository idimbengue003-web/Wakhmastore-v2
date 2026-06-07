'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { DemandCard } from '@/components/DemandCard'
import { getRevealPrice } from '@/lib/constants'
import { Zap, Eye, Crown, Star, ArrowRight, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Demand {
  id: string
  title: string
  description: string
  category: string
  budget: number
  price: number
  quartier: string
  urgency: string
  photo?: string | null
  whatsapp: string
  whatsappRevealed: boolean
  status: string
  annonceType: string
  expiresAt?: string | null
  createdAt: string
  userName: string
  userSubscriptionTier?: string | null
  userType?: string
  userSalesCount?: number
  userPurchasesCount?: number
  hasPhoneInText: boolean
}

export default function ProDashboard() {
  const { user, fetchUser } = useAuthStore()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/demands')
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setDemands(data.demands.slice(0, 12))
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleReveal = () => {
    async function refresh() {
      try {
        const res = await fetch('/api/demands')
        if (res.ok) {
          const data = await res.json()
          setDemands(data.demands.slice(0, 12))
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    refresh()
    fetchUser()
  }

  const revealPrice = user ? getRevealPrice(user.role, user.subscriptionTier) : 1000

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard Pro 💎
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenue, {user?.name || 'Vendeur'}. Accède aux numéros des acheteurs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Points</p>
              <p className="text-xl font-bold text-gray-900">
                {user?.points?.toLocaleString('fr-FR') || 0} pts
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix révélation</p>
              <p className="text-xl font-bold text-gray-900">
                {revealPrice.toLocaleString('fr-FR')} pts
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              {user?.subscriptionTier === 'king' ? (
                <Crown className="w-5 h-5 text-yellow-600" />
              ) : (
                <Star className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Abonnement</p>
              <p className="text-xl font-bold text-gray-900">
                {user?.subscriptionTier === 'king' ? '⭐ VIP KING' : user?.subscriptionTier === 'diambar' ? '💎 Diambar' : 'Aucun'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription CTA if not subscribed */}
      {(!user?.subscriptionTier || user.subscriptionTier === null) && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Passe en Diambar 💎</h3>
              <p className="text-sm text-gray-600">
                Révèle les numéros à 1 000 pts au lieu de 1 500 + 30 000 points offerts
              </p>
            </div>
            <Link
              href="/recharge"
              className="px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 inline mr-1" />
              S&apos;abonner
            </Link>
          </div>
        </div>
      )}

      {/* Recent Demands */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Demandes récentes</h2>
        <Link
          href="/annonces"
          className="text-sm font-medium text-blue-800 hover:text-blue-900 flex items-center gap-1"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {demands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              onReveal={handleReveal}
            />
          ))}
        </div>
      )}
    </div>
  )
}
