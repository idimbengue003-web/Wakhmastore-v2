'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DemandCard } from '@/components/DemandCard'
import { CATEGORIES, CATEGORY_EMOJIS } from '@/lib/constants'
import { Search, SlidersHorizontal, X } from 'lucide-react'

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
  annonceType?: string
  expiresAt?: string | null
  createdAt: string
  userName: string
  userSubscriptionTier?: string | null
  userType?: string
  userSalesCount?: number
  userPurchasesCount?: number
  hasPhoneInText: boolean
}

function AnnoncesContent() {
  const searchParams = useSearchParams()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'Toutes')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (category && category !== 'Toutes') params.set('category', category)
        if (search) params.set('search', search)

        const res = await fetch(`/api/demands?${params.toString()}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setDemands(data.demands)
        }
      } catch (error) {
        console.error('Error fetching demands:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [category, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleReveal = () => {
    async function refresh() {
      try {
        const params = new URLSearchParams()
        if (category && category !== 'Toutes') params.set('category', category)
        if (search) params.set('search', search)
        const res = await fetch(`/api/demands?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setDemands(data.demands)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    refresh()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Annonces à Dakar
        </h1>
        <p className="text-gray-500">
          Trouve ce que tu cherches parmi les demandes des acheteurs
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une annonce..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none transition-all text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors lg:hidden"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          Rechercher
        </button>
      </form>

      {/* Category filter */}
      <div className={`mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Filtrer par catégorie</h3>
          {category !== 'Toutes' && (
            <button
              onClick={() => setCategory('Toutes')}
              className="text-xs text-orange hover:text-orange-dark flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Effacer le filtre
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setCategory('Toutes')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === 'Toutes'
                ? 'bg-orange text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-orange text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_EMOJIS[cat] || '📦'} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : demands.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune annonce trouvée
          </h3>
          <p className="text-gray-500 mb-6">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {demands.length} annonce{demands.length > 1 ? 's' : ''} trouvée{demands.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {demands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onReveal={handleReveal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-12 bg-gray-200 rounded" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-64 bg-gray-200 rounded-2xl" />)}</div></div></div>}>
      <AnnoncesContent />
    </Suspense>
  )
}
