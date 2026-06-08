'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { CATEGORY_EMOJIS, formatFCFA, getRevealPrice, timeAgo, maskPhone } from '@/lib/constants'
import {
  ArrowLeft, MapPin, Clock, MessageCircle, CheckCircle, Eye,
  AlertTriangle, Shield, Zap, Share2, Flag, Star, Crown, Copy
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
  annonceType?: string
  expiresAt?: string | null
  createdAt: string
  userName: string
  userSubscriptionTier?: string | null
  userType?: string
  userSalesCount?: number
  userPurchasesCount?: number
  hasPhoneInText: boolean
  revealCount: number
}

export default function AnnonceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
  const [demand, setDemand] = useState<DemandDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revealStep, setRevealStep] = useState<'info' | 'confirm' | 'revealed'>('info')
  const [revealing, setRevealing] = useState(false)
  const [revealedWhatsapp, setRevealedWhatsapp] = useState('')
  const [revealPrice, setRevealPrice] = useState(1000)
  const [errorMsg, setErrorMsg] = useState('')
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    async function loadDemand() {
      try {
        const res = await fetch(`/api/demands/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setDemand(data.demand)
          if (data.demand.whatsappRevealed) {
            setRevealStep('revealed')
            setRevealedWhatsapp(data.demand.whatsapp)
          }
          const price = user ? getRevealPrice(user.role, user.subscriptionTier) : 1000
          setRevealPrice(price)
        } else {
          setError('Annonce introuvable')
        }
      } catch {
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) loadDemand()
  }, [params.id, user])

  const handleReveal = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (revealing) return
    setRevealing(true)
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId: demand!.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setRevealedWhatsapp(data.whatsapp)
        setRevealStep('revealed')
        await fetchUser()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la révélation')
        setRevealStep('info')
      }
    } catch {
      setErrorMsg('Erreur de connexion')
      setRevealStep('info')
    } finally {
      setRevealing(false)
    }
  }

  const openWhatsApp = () => {
    if (revealedWhatsapp) {
      const cleaned = revealedWhatsapp.replace(/\s/g, '')
      window.open(`https://wa.me/221${cleaned}`, '_blank')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const text = demand ? `${demand.title} - Wakhma Store` : 'Wakhma Store'
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setShareMsg('Lien copié !')
      setTimeout(() => setShareMsg(''), 2000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !demand) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Annonce introuvable'}</h2>
        <Link href="/annonces" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Voir les annonces
        </Link>
      </div>
    )
  }

  const isVente = demand.annonceType === 'vends'
  const isSold = demand.status === 'sold'
  const isExpired = demand.status === 'expired'
  const emoji = CATEGORY_EMOJIS[demand.category] || '📦'

  const subscriptionBadge = demand.userSubscriptionTier === 'king'
    ? '⭐ VIP KING'
    : demand.userSubscriptionTier === 'diambar'
      ? '💎 Diambar'
      : null

  const urgencyLabels: Record<string, string> = {
    urgent: '🔥 Urgent',
    '2jours': '⏳ Dans 2 jours',
    '1semaine': '📅 Dans 1 semaine',
    flexible: '😊 Flexible',
  }

  const getDaysLeft = () => {
    if (!demand.expiresAt) return null
    const now = new Date()
    const exp = new Date(demand.expiresAt)
    const diff = exp.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
  const daysLeft = getDaysLeft()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back + Share */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/annonces" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange">
          <ArrowLeft className="w-4 h-4" /> Retour aux annonces
        </Link>
        <div className="flex items-center gap-2">
          {shareMsg && (
            <span className="text-xs text-green-600 font-medium">{shareMsg}</span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-orange hover:bg-orange-bg rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" /> Partager
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Photo Header */}
        {demand.photo ? (
          <div className="relative h-64 sm:h-80 bg-gray-100 overflow-hidden">
            <img src={demand.photo} alt={demand.title} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2.5 py-1 bg-white/95 rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
                {emoji} {demand.category}
              </span>
              {isVente && (
                <span className="px-2.5 py-1 bg-orange text-white rounded-lg text-xs font-bold shadow-sm">
                  Je vends
                </span>
              )}
            </div>
            {isSold && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="px-6 py-3 bg-blue-800 text-white rounded-xl font-bold text-lg">
                  ✓ Vendu
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-32 bg-orange-bg flex items-center justify-center">
            <span className="text-6xl">{emoji}</span>
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2.5 py-1 bg-white/95 rounded-lg text-xs font-semibold text-gray-700">
                {emoji} {demand.category}
              </span>
              {isVente && (
                <span className="px-2.5 py-1 bg-orange text-white rounded-lg text-xs font-bold">
                  Je vends
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status badges */}
        {(isSold || isExpired || subscriptionBadge) && (
          <div className="flex items-center gap-2 px-5 pt-4 flex-wrap">
            {isSold && (
              <span className="px-3 py-1 bg-indigo-100 text-blue-900 rounded-lg text-xs font-bold">
                ✓ Vendu
              </span>
            )}
            {isExpired && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                Expirée
              </span>
            )}
            {subscriptionBadge && (
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                demand.userSubscriptionTier === 'king'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-50 text-blue-900'
              }`}>
                {subscriptionBadge}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title + Price */}
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${isSold ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {demand.title}
            </h1>
            {(isVente && demand.price > 0) && (
              <div className="text-2xl font-extrabold text-orange mt-2">
                {formatFCFA(demand.price)}
              </div>
            )}
            {(!isVente && demand.budget > 0) && (
              <div className="text-2xl font-extrabold text-orange mt-2">
                Budget : {formatFCFA(demand.budget)}
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                <MapPin className="w-3.5 h-3.5" /> Quartier
              </div>
              <p className="text-sm font-semibold text-gray-900">{demand.quartier}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" /> Publiée
              </div>
              <p className="text-sm font-semibold text-gray-900">{timeAgo(new Date(demand.createdAt))}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                <Eye className="w-3.5 h-3.5" /> Intéressés
              </div>
              <p className="text-sm font-semibold text-gray-900">{demand.revealCount} personne{demand.revealCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Urgency */}
          {!isVente && demand.urgency !== 'flexible' && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              demand.urgency === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {urgencyLabels[demand.urgency] || '😊 Flexible'}
            </div>
          )}

          {/* Expiry */}
          {!isSold && !isExpired && daysLeft !== null && (
            <div className={`text-xs font-medium ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {daysLeft <= 0 ? 'Expire aujourd\'hui !' : daysLeft === 1 ? 'Expire demain' : `Expire dans ${daysLeft} jours`}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{demand.description}</p>
          </div>

          {/* Seller info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{demand.userName}</span>
                  {demand.userSubscriptionTier === 'king' && <Star className="w-4 h-4 text-yellow-500" />}
                  {demand.userSubscriptionTier === 'diambar' && <Crown className="w-4 h-4 text-blue-800" />}
                </div>
                <p className="text-xs text-gray-500 capitalize">{demand.userType === 'vendeur' ? '🛒 Vendeur' : '🔍 Acheteur'}</p>
              </div>
              <div className="flex gap-3 text-xs">
                {(demand.userSalesCount ?? 0) > 0 && (
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{demand.userSalesCount}</div>
                    <div className="text-gray-500">Ventes</div>
                  </div>
                )}
                {(demand.userPurchasesCount ?? 0) > 0 && (
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{demand.userPurchasesCount}</div>
                    <div className="text-gray-500">Achats</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ WHATSAPP REVEAL SECTION ═══ */}
          {!isSold && !isExpired && (
            <div className="border-t border-gray-200 pt-4">
              {revealStep === 'info' && (
                <div className="space-y-4">
                  {/* Info about reveal */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Numéro WhatsApp protégé
                        </h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Le numéro WhatsApp du vendeur est masqué pour protéger sa vie privée.
                          Pour le révéler, tu dois dépenser <strong>{revealPrice} points</strong>.
                          {user ? (
                            <> Tu as actuellement <strong>{user.points.toLocaleString('fr-FR')} points</strong>.</>
                          ) : (
                            <> Connecte-toi pour révéler le numéro.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user && user.points < revealPrice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Points insuffisants. <Link href="/recharge" className="font-semibold text-orange hover:underline">Recharge ton compte</Link> pour révéler ce numéro.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/login')
                        return
                      }
                      setRevealStep('confirm')
                    }}
                    className="w-full py-3.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Révéler le numéro WhatsApp
                  </button>
                </div>
              )}

              {revealStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800 mb-1">
                          Confirmer la révélation
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Tu vas dépenser <strong>{revealPrice} points</strong> pour révéler le numéro WhatsApp de cette annonce.
                          Cette action est irréversible. Ton solde passera de <strong>{user?.points.toLocaleString('fr-FR')}</strong> à <strong>{((user?.points ?? 0) - revealPrice).toLocaleString('fr-FR')}</strong> points.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setRevealStep('info')}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleReveal}
                      disabled={revealing || (user?.points ?? 0) < revealPrice}
                      className="flex-1 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {revealing ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Confirmer ({revealPrice} pts)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {revealStep === 'revealed' && revealedWhatsapp && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-800 mb-1">
                          Numéro révélé !
                        </h4>
                        <p className="text-lg font-bold text-green-900 tracking-wide">
                          {revealedWhatsapp}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={openWhatsApp}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter sur WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
