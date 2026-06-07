'use client'

import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { ArrowLeft, Eye, Zap, TrendingUp, Calendar } from 'lucide-react'

export default function ProStatsPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/pro" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Statistiques
        </h1>
        <p className="text-gray-500 mt-1">Tes performances vendeur</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Eye className="w-5 h-5 text-blue-800" />}
          label="Révélations"
          value="0"
          bgColor="bg-indigo-100"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-blue-800" />}
          label="Points dépensés"
          value="0"
          bgColor="bg-indigo-100"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-800" />}
          label="Taux de contact"
          value="-"
          bgColor="bg-indigo-100"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          label="Abonnement"
          value={user?.subscriptionTier === 'king' ? 'VIP KING' : user?.subscriptionTier === 'diambar' ? 'Diambar' : 'Aucun'}
          bgColor="bg-purple-100"
        />
      </div>

      {/* Current plan info */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ton plan actuel</h2>
        {user?.subscriptionTier ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Abonnement</span>
              <span className="text-sm font-semibold text-gray-900">
                {user.subscriptionTier === 'king' ? '⭐ VIP KING' : '💎 Diambar'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Points restants</span>
              <span className="text-sm font-semibold text-gray-900">
                {user?.points?.toLocaleString('fr-FR') || 0} pts
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Prix par révélation</span>
              <span className="text-sm font-semibold text-blue-800">
                {user.subscriptionTier === 'king' ? '500' : '1 000'} pts
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucun abonnement actif</p>
            <Link
              href="/recharge"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-xl font-medium text-sm transition-all"
            >
              S&apos;abonner
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
