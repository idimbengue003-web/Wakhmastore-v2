'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DemandCard } from '@/components/DemandCard'
import { CATEGORIES, CATEGORY_EMOJIS, QUARTIERS } from '@/lib/constants'
import { Search, SlidersHorizontal, X, Loader2, CheckCircle, ArrowUpDown } from 'lucide-react'

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

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'urgent'

function AnnoncesContent() {
  const searchParams = useSearchParams()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'Toutes')
  const [quartier, setQuartier] = useState('Tous')
  const [annonceType, setAnnonceType] = useState<string>('tous')
  const [sort, setSort] = useState<SortOption>('recent')
  const [showFilters, setShowFilters] = useState(false)

  const fetchDemands = useCallback(async (cursor?: string) => {
    const isLoadMore = !!cursor
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const params = new URLSearchParams()
      if (category && category !== 'Toutes') params.set('category', category)
      if (search) params.set('search', search)
      if (quartier && quartier !== 'Tous') params.set('quartier', quartier)
      if (annonceType && annonceType !== 'tous') params.set('annonceType', annonceType)
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/demands?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (isLoadMore) {
          setDemands((prev) => [...prev, ...data.demands])
        } else {
          setDemands(data.demands)
        }
        setNextCursor(data.nextCursor)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error fetching demands:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [category, search, quartier, annonceType])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (category && category !== 'Toutes') params.set('category', category)
        if (search) params.set('search', search)
        if (quartier && quartier !== 'Tous') params.set('quartier', quartier)
        if (annonceType && annonceType !== 'tous') params.set('annonceType', annonceType)

        const res = await fetch(`/api/demands?${params.toString()}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setDemands(data.demands)
          setNextCursor(data.nextCursor)
          setTotal(data.total)
        }
      } catch (error) {
        console.error('Error fetching demands:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [category, search, quartier, annonceType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchDemands(nextCursor)
    }
  }

  const clearFilters = () => {
    setCategory('Toutes')
    setQuartier('Tous')
    setAnnonceType('tous')
    setSort('recent')
    setSearch('')
    setSearchInput('')
  }

  const hasActiveFilters = category !== 'Toutes' || quartier !== 'Tous' || annonceType !== 'tous' || search !== ''

  // Client-side sort
  const sortedDemands = [...demands].sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return (a.price || a.budget || 0) - (b.price || b.budget || 0)
      case 'price_desc':
        return (b.price || b.budget || 0) - (a.price || a.budget || 0)
      case 'urgent':
        const urgencyOrder: Record<string, number> = { urgent: 0, '2jours': 1, '1semaine': 2, flexible: 3 }
        return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const hasMore = nextCursor !== null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Annonces à Dakar
        </h1>
        <p className="text-gray-500">
          Trouve ce que tu cherches parmi les demandes des acheteurs
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une annonce..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none transition-all text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-xl transition-colors flex items-center gap-1.5 ${
            showFilters || hasActiveFilters
              ? 'border-orange bg-orange-bg text-orange'
              : 'border-gray-300 hover:bg-gray-50 text-gray-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Filtres</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-orange rounded-full" />
          )}
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          Rechercher
        </button>
      </form>

      {/* Filters Panel */}
      <div className={`mb-6 ${showFilters ? 'block' : 'hidden'}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {/* Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Catégorie</h3>
              {category !== 'Toutes' && (
                <button onClick={() => setCategory('Toutes')} className="text-xs text-orange hover:text-orange-dark">Effacer</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
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

          {/* Type + Quartier + Sort Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Annonce Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Type d&apos;annonce</h3>
              <div className="flex gap-2">
                {[
                  { value: 'tous', label: 'Tous' },
                  { value: 'cherche', label: '🔍 Je cherche' },
                  { value: 'vends', label: '🛒 Je vends' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnnonceType(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      annonceType === opt.value
                        ? 'bg-orange text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quartier */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Quartier</h3>
              <select
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange focus:border-orange outline-none"
              >
                <option value="Tous">Tous les quartiers</option>
                {QUARTIERS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Trier par</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSort('recent')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    sort === 'recent'
                      ? 'bg-orange text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpDown className="w-3 h-3" /> Récents
                </button>
                <button
                  onClick={() => setSort('price_asc')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sort === 'price_asc'
                      ? 'bg-orange text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Prix ↑
                </button>
                <button
                  onClick={() => setSort('price_desc')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sort === 'price_desc'
                      ? 'bg-orange text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Prix ↓
                </button>
                <button
                  onClick={() => setSort('urgent')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sort === 'urgent'
                      ? 'bg-orange text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔥 Urgent
                </button>
              </div>
            </div>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={clearFilters}
                className="text-xs text-orange hover:text-orange-dark font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Effacer tous les filtres
              </button>
            </div>
          )}
        </div>
      </div>

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
      ) : sortedDemands.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune annonce trouvée
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters
              ? 'Essayez de modifier vos critères de recherche'
              : 'Soyez le premier à poster une annonce !'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="text-orange font-semibold text-sm hover:underline"
            >
              Effacer les filtres
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {sortedDemands.length} annonce{sortedDemands.length > 1 ? 's' : ''} chargée{sortedDemands.length > 1 ? 's' : ''} sur {total}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
              />
            ))}
          </div>

          {/* Load More Button */}
          <div className="mt-8 flex justify-center">
            {loadingMore ? (
              <div className="flex items-center gap-2 px-6 py-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Chargement...</span>
              </div>
            ) : hasMore ? (
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                Charger plus
              </button>
            ) : (
              <div className="flex items-center gap-2 px-6 py-3 text-gray-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Toutes les annonces chargées</span>
              </div>
            )}
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
