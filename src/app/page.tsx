'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowRight, Zap, Shield, TrendingUp, MapPin, MessageCircle, CheckCircle } from 'lucide-react'
import { CATEGORIES, CATEGORY_EMOJIS, formatFCFA, timeAgo } from '@/lib/constants'
import { useState, useEffect, useMemo } from 'react'

interface Annonce {
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
  expiresAt: string | null
  createdAt: string
  userName: string
  userSubscriptionTier?: string | null
  userSalesCount: number
  userPurchasesCount: number
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadAnnonces() {
      try {
        const res = await fetch('/api/demands?limit=12')
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setAnnonces(data.demands.slice(0, 12))
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAnnonces()
    return () => { cancelled = true }
  }, [])

  const filteredAnnonces = useMemo(() => {
    if (!searchQuery.trim()) return annonces
    const q = searchQuery.toLowerCase()
    return annonces.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.quartier.toLowerCase().includes(q)
    )
  }, [searchQuery, annonces])

  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO */}
      <section className="bg-gradient-to-r from-orange-dark to-orange relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
              Wakhma Store
            </h1>
            <p className="text-white/90 text-lg sm:text-xl mb-6 font-medium">
              Les bonnes affaires à Dakar
            </p>

            {/* Search bar */}
            <div className="search-bar-shadow bg-white rounded-2xl p-1.5 flex flex-col sm:flex-row gap-1.5 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Que cherchez-vous ?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-gray-900 text-sm placeholder-gray-400 rounded-xl focus:outline-none bg-gray-50 focus:bg-white"
                />
              </div>
              <Link
                href={searchQuery ? `/annonces?search=${encodeURIComponent(searchQuery)}` : '/annonces'}
                className="px-6 py-3 bg-orange hover:bg-orange-dark text-white font-bold rounded-xl text-sm shrink-0 text-center"
              >
                Rechercher
              </Link>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {['Téléphones', 'TV & Écrans', 'Ordinateurs', 'Meubles', 'Transport', 'Immobilier'].map(cat => (
                <Link
                  key={cat}
                  href={`/annonces?category=${encodeURIComponent(cat)}`}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-full border border-white/25"
                >
                  {CATEGORY_EMOJIS[cat]} {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ANNONCES GRID */}
      <section className="flex-1 bg-gray-50 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Annonces récentes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {loading ? 'Chargement...' : `${filteredAnnonces.length} annonce${filteredAnnonces.length > 1 ? 's' : ''} à Dakar`}
              </p>
            </div>
            <Link
              href="/annonces"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-orange hover:text-orange-dark"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAnnonces.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucune annonce'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery ? 'Essaie avec d\'autres mots-clés' : 'Sois le premier à poster !'}
              </p>
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="text-orange font-semibold text-sm">Effacer la recherche</button>
              ) : (
                <Link href="/deposer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm">
                  Déposer une annonce
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredAnnonces.map(annonce => (
                <HomeAnnonceCard key={annonce.id} annonce={annonce} />
              ))}
            </div>
          )}

          <div className="sm:hidden mt-4 text-center">
            <Link href="/annonces" className="inline-flex items-center gap-1 text-sm font-semibold text-orange">
              Voir toutes les annonces <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Catégories
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/annonces?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-1 p-2.5 bg-gray-50 hover:bg-orange-bg rounded-xl border border-gray-100 hover:border-orange/30 group"
              >
                <span className="text-xl">{CATEGORY_EMOJIS[cat] || '📦'}</span>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600 group-hover:text-orange text-center leading-tight">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-orange-bg py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustCard icon={<Zap className="w-5 h-5" />} title="Rapide" description="Poste ta demande en 30 secondes et reçois des offres rapidement." />
            <TrustCard icon={<Shield className="w-5 h-5" />} title="Fiable" description="Vendeurs avec abonnement Diambar ou VIP KING. Annonces vérifiées." />
            <TrustCard icon={<TrendingUp className="w-5 h-5" />} title="Efficace" description="Passe directement par WhatsApp. Pas d'intermédiaire." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-8 sm:py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Tu cherches un objet introuvable ou budget limité ?
          </h2>
          <p className="text-gray-600 mb-5 text-sm">
            Dépose ton annonce gratuitement et des acheteurs te contacteront directement sur WhatsApp.
          </p>
          <Link
            href="/deposer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm shadow-md"
          >
            Déposer une annonce <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

/* Home page AnnonceCard - navigates to detail page */
function HomeAnnonceCard({ annonce }: { annonce: Annonce }) {
  const emoji = CATEGORY_EMOJIS[annonce.category] || '📦'
  const isVente = annonce.annonceType === 'vends'

  const subscriptionBadge = annonce.userSubscriptionTier === 'king'
    ? '⭐ VIP KING'
    : annonce.userSubscriptionTier === 'diambar'
      ? '💎 Diambar'
      : null

  return (
    <Link href={`/annonces/${annonce.id}`} className="block">
      <div className="annonce-card bg-white rounded-xl border border-gray-200 overflow-hidden group cursor-pointer">
        {annonce.photo ? (
          <div className="relative h-40 sm:h-44 bg-gray-100 overflow-hidden">
            {annonce.photo!.startsWith('data:') ? (
              <img
                src={annonce.photo!}
                alt={annonce.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={annonce.photo!}
                alt={annonce.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded-md text-[10px] font-semibold text-gray-700">
              {emoji} {annonce.category}
            </span>
            {isVente && (
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange text-white rounded-md text-[10px] font-bold">
                Je veux vendre
              </span>
            )}
          </div>
        ) : (
          <div className="relative h-24 sm:h-28 bg-orange-bg flex items-center justify-center">
            <span className="text-4xl">{emoji}</span>
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded-md text-[10px] font-semibold text-gray-700">
              {annonce.category}
            </span>
            {isVente && (
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange text-white rounded-md text-[10px] font-bold">
                Je veux vendre
              </span>
            )}
          </div>
        )}

        {(isVente || subscriptionBadge) && (
          <div className="flex items-center gap-1 px-3 pt-2">
            {subscriptionBadge && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                annonce.userSubscriptionTier === 'king'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-50 text-blue-900'
              }`}>
                {subscriptionBadge}
              </span>
            )}
          </div>
        )}

        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange">
            {annonce.title}
          </h3>

          {(annonce.price > 0 || annonce.budget > 0) && (
            <div className="text-orange text-lg font-extrabold tracking-tight">
              {annonce.price > 0 ? formatFCFA(annonce.price) : formatFCFA(annonce.budget)}
            </div>
          )}

          <div className="flex items-center gap-1 text-gray-400 text-[11px]">
            <MapPin className="w-3 h-3" />
            <span>{annonce.quartier}</span>
            <span>•</span>
            <span>{timeAgo(new Date(annonce.createdAt))}</span>
          </div>

          {(annonce.userSalesCount > 0 || annonce.userPurchasesCount > 0) && (
            <div className="flex items-center gap-2 text-[10px]">
              {annonce.userSalesCount > 0 && (
                <span className="flex items-center gap-0.5 text-blue-800">
                  <CheckCircle className="w-2.5 h-2.5" /> {annonce.userSalesCount} vente{annonce.userSalesCount > 1 ? 's' : ''}
                </span>
              )}
              {annonce.userPurchasesCount > 0 && (
                <span className="flex items-center gap-0.5 text-blue-800">
                  <CheckCircle className="w-2.5 h-2.5" /> {annonce.userPurchasesCount} achat{annonce.userPurchasesCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {annonce.whatsappRevealed ? (
            <div className="w-full flex items-center justify-center gap-1.5 mt-1 px-3 py-2 bg-blue-800 text-white rounded-lg font-bold text-xs">
              <MessageCircle className="w-3.5 h-3.5" /> Voir l&apos;annonce
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 mt-1 px-3 py-2 bg-orange hover:bg-orange-dark text-white rounded-lg font-bold text-xs transition-colors">
              Voir les détails
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-orange/10">
      <div className="w-10 h-10 bg-orange/10 text-orange rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
