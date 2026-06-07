'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  CATEGORY_EMOJIS, formatFCFA, getRevealPrice, timeAgo, maskPhone,
  containsPhoneInText, maskPhonesInText
} from '@/lib/constants'
import {
  ArrowLeft, MapPin, Clock, MessageCircle, Eye, CheckCircle,
  Shield, Zap, AlertTriangle, Share2, Flag, User, Star,
  Package, CalendarDays, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface DemandDetail {
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

export default function AnnonceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuthStore()
  const router = useRouter()
  const [demand, setDemand] = useState<DemandDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadDemand() {
      try {
        const res = await fetch(`/api/demands/${id}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          if (data.demand) {
            setDemand(data.demand)
            if (data.demand.whatsappRevealed) {
              setRevealed(true)
              setWhatsapp(data.demand.whatsapp)
            }
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDemand()
    return () => { cancelled = true }
  }, [id])

  const handleReveal = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (revealing) return
    setRevealing(true)
    setError('')
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId: id }),
      })
      const data = await res.json()
      if (res.ok) {
        setWhatsapp(data.whatsapp)
        setRevealed(true)
        setShowConfirmModal(false)
      } else {
        setError(data.error || 'Erreur lors de la révélation')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setRevealing(false)
    }
  }

  const openWhatsApp = () => {
    if (whatsapp) {
      const cleaned = whatsapp.replace(/\s/g, '')
      window.open(`https://wa.me/221${cleaned}`, '_blank')
    }
  }

  const revealPrice = user ? getRevealPrice(user.role, user.subscriptionTier) : 1000

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!demand) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Annonce introuvable</h1>
        <p className="text-gray-500 mb-6">Cette annonce n&apos;existe pas ou a été supprimée.</p>
        <Link href="/annonces" className="inline-flex items-center gap-2 px-6 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Voir les annonces
        </Link>
      </div>
    )
  }

  const emoji = CATEGORY_EMOJIS[demand.category] || '📦'
  const isVente = demand.annonceType === 'vends'
  const isSold = demand.status === 'sold'
  const isExpired = demand.status === 'expired'
  const isOwner = user && demand.userName === user.name

  const subscriptionBadge = demand.userSubscriptionTier === 'king'
    ? { label: 'VIP KING', icon: '⭐', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    : demand.userSubscriptionTier === 'diambar'
      ? { label: 'Diambar', icon: '💎', color: 'bg-blue-50 text-blue-900 border-blue-200' }
      : null

  const urgencyLabels: Record<string, { label: string; color: string }> = {
    urgent: { label: '🔥 Urgent', color: 'bg-red-100 text-red-700' },
    '2jours': { label: '⏳ Dans 2 jours', color: 'bg-yellow-100 text-yellow-700' },
    '1semaine': { label: '📅 Dans 1 semaine', color: 'bg-yellow-100 text-yellow-700' },
    flexible: { label: '😊 Flexible', color: 'bg-indigo-100 text-blue-900' },
  }
  const urgency = urgencyLabels[demand.urgency] || urgencyLabels.flexible

  // Days left before expiry
  const getDaysLeft = () => {
    if (!demand.expiresAt) return null
    const now = new Date()
    const exp = new Date(demand.expiresAt)
    const diff = exp.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
  const daysLeft = getDaysLeft()

  // Masked description
  const safeDescription = demand.hasPhoneInText
    ? maskPhonesInText(demand.description)
    : demand.description

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Back button */}
      <Link href="/annonces" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange mb-4 font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour aux annonces
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Photo or emoji header */}
        {demand.photo ? (
          <div className="relative h-56 sm:h-72 md:h-80 bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demand.photo}
              alt={demand.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Category badge on photo */}
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
              {emoji} {demand.category}
            </span>
            {/* Type badge */}
            {isVente && (
              <span className="absolute top-3 right-3 px-3 py-1.5 bg-orange text-white rounded-lg text-xs font-bold shadow-sm">
                Je veux vendre
              </span>
            )}
          </div>
        ) : (
          <div className="relative h-36 sm:h-44 bg-gradient-to-br from-orange-bg to-blue-50 flex items-center justify-center">
            <span className="text-6xl sm:text-7xl">{emoji}</span>
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
              {demand.category}
            </span>
            {isVente && (
              <span className="absolute top-3 right-3 px-3 py-1.5 bg-orange text-white rounded-lg text-xs font-bold shadow-sm">
                Je veux vendre
              </span>
            )}
          </div>
        )}

        {/* Status badges row */}
        {(isSold || isExpired || subscriptionBadge) && (
          <div className="flex items-center gap-2 px-5 pt-4 flex-wrap">
            {isSold && (
              <span className="px-3 py-1 bg-indigo-100 text-blue-900 rounded-lg text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Vendu
              </span>
            )}
            {isExpired && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                Expirée
              </span>
            )}
            {subscriptionBadge && (
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${subscriptionBadge.color}`}>
                {subscriptionBadge.icon} {subscriptionBadge.label}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-5 space-y-5">
          {/* Title + Price */}
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold text-gray-900 leading-tight ${isSold ? 'line-through text-gray-400' : ''}`}>
              {demand.title}
            </h1>
            {(isVente && demand.price > 0) ? (
              <div className="text-orange text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                {formatFCFA(demand.price)}
              </div>
            ) : demand.budget > 0 ? (
              <div className="mt-2">
                <span className="text-xs text-gray-500 font-medium">Budget :</span>{' '}
                <span className="text-orange text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {formatFCFA(demand.budget)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Quick info chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
              <MapPin className="w-3.5 h-3.5 text-orange" /> {demand.quartier}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${urgency.color}`}>
              {urgency.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
              <Clock className="w-3.5 h-3.5 text-orange" /> {timeAgo(new Date(demand.createdAt))}
            </span>
            {daysLeft !== null && !isSold && !isExpired && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                daysLeft <= 1 ? 'bg-red-100 text-red-700' : daysLeft <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                <CalendarDays className="w-3.5 h-3.5" />
                {daysLeft <= 0 ? "Expire aujourd'hui !" : daysLeft === 1 ? 'Expire demain' : `Expire dans ${daysLeft} jours`}
              </span>
            )}
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-3 p-4 bg-orange-bg/60 rounded-xl border border-orange/10">
            <div className="w-11 h-11 bg-orange rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900 truncate">{demand.userName}</span>
                {demand.userSubscriptionTier === 'king' && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                {demand.userSubscriptionTier === 'diambar' && <span className="text-xs">💎</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                {demand.userType === 'vendeur' ? 'Vendeur' : 'Acheteur'}
                {(demand.userSalesCount ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-800 font-medium">
                    <CheckCircle className="w-3 h-3" /> {demand.userSalesCount} vente{(demand.userSalesCount ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
                {(demand.userPurchasesCount ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-800 font-medium">
                    <CheckCircle className="w-3 h-3" /> {demand.userPurchasesCount} achat{(demand.userPurchasesCount ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {safeDescription}
            </p>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 bg-green-50 rounded-xl text-center">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-[10px] font-medium text-green-700">Vérifié</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 rounded-xl text-center">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-medium text-blue-700">Réponse rapide</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 rounded-xl text-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-[10px] font-medium text-purple-700">Populaire</span>
            </div>
          </div>

          {/* Action section - this is the key new feature */}
          {!isSold && !isExpired && !isOwner && (
            <div className="border-t border-gray-100 pt-5 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {revealed ? (
                /* Already revealed - show WhatsApp contact */
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Numéro WhatsApp disponible</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-lg">
                        <span className="text-lg font-bold text-gray-900 tracking-wide">+221 {whatsapp}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" /> Contacter sur WhatsApp
                  </button>
                </div>
              ) : (
                /* Not yet revealed - show reveal CTA */
                <div className="space-y-3">
                  {/* Phone masked preview */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Numéro WhatsApp</span>
                    </div>
                    <span className="text-lg font-bold text-gray-400 tracking-wider">
                      +221 {maskPhone(demand.whatsapp)}
                    </span>
                  </div>

                  {/* Reveal button */}
                  {user ? (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm shadow-lg shadow-orange/20 transition-all"
                    >
                      <Eye className="w-5 h-5" />
                      Voir le numéro WhatsApp ({revealPrice} pts)
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm"
                    >
                      <Eye className="w-5 h-5" />
                      Connecte-toi pour voir le numéro
                    </Link>
                  )}

                  <p className="text-[11px] text-gray-400 text-center">
                    En révélant ce numéro, {revealPrice} points seront déduits de votre solde.
                    Vous pourrez ensuite contacter le vendeur directement sur WhatsApp.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && !isSold && !isExpired && (
            <div className="border-t border-gray-100 pt-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                <Package className="w-4 h-4" /> C&apos;est votre annonce. Gérez-la depuis votre profil.
              </div>
            </div>
          )}

          {/* Share & Report */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: demand.title, url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Lien copié !')
                }
              }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange font-medium"
            >
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 font-medium">
              <Flag className="w-3.5 h-3.5" /> Signaler
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 bg-orange-bg rounded-full flex items-center justify-center mx-auto">
                <Eye className="w-7 h-7 text-orange" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Révéler le numéro ?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vous allez dépenser <span className="font-bold text-orange">{revealPrice} points</span> pour voir le numéro WhatsApp de cet annonceur.
                </p>
              </div>

              {/* Recap */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Annonce</span>
                  <span className="font-medium text-gray-900 truncate ml-2 max-w-[180px]">{demand.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendeur</span>
                  <span className="font-medium text-gray-900">{demand.userName}</span>
                </div>
                {isVente && demand.price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prix</span>
                    <span className="font-bold text-orange">{formatFCFA(demand.price)}</span>
                  </div>
                )}
                {!isVente && demand.budget > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-bold text-orange">{formatFCFA(demand.budget)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Coût</span>
                  <span className="font-bold text-orange">{revealPrice} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Votre solde</span>
                  <span className={`font-bold ${(user?.points ?? 0) >= revealPrice ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.points?.toLocaleString('fr-FR') ?? 0} pts
                  </span>
                </div>
              </div>

              {(user?.points ?? 0) < revealPrice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Points insuffisants. <Link href="/recharge" className="font-bold text-orange underline">Rechargez votre compte</Link></span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReveal}
                  disabled={revealing || (user?.points ?? 0) < revealPrice}
                  className="flex-1 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {revealing ? 'Chargement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
