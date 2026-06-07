'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { CATEGORY_EMOJIS, formatFCFA, timeAgo, VENDOR_ANNONCE_LIMITS } from '@/lib/constants'
import {
  User, Zap, Package, ShoppingCart, TrendingUp, RefreshCw,
  Trash2, CheckCircle, AlertTriangle, ArrowLeft, Store, Search,
  Clock, Eye, MapPin, Star, Crown, LogOut, ChevronRight,
  CreditCard, MessageCircle
} from 'lucide-react'
import Link from 'next/link'

interface PaymentRecord {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  orderReference: string | null
  tierIndex: number | null
  tierId: string | null
  provider: string
  senderPhone: string | null
  transactionId: string | null
  createdAt: string
  completedAt: string | null
  adminNote: string | null
}

interface MyDemand {
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
  status: string
  annonceType: string
  expiresAt: string | null
  createdAt: string
  userName: string
  userSubscriptionTier?: string | null
  hasPhoneInText: boolean
}

export default function ProfilPage() {
  const { user, fetchUser, logout } = useAuthStore()
  const router = useRouter()
  const [demands, setDemands] = useState<MyDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])

  const loadDemands = useCallback(async () => {
    try {
      const res = await fetch(`/api/demands?userId=${user?.userId}`)
      if (res.ok) {
        const data = await res.json()
        setDemands(data.demands)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user?.userId])

  const loadPaymentHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/payment/history')
      if (res.ok) {
        const data = await res.json()
        setPaymentHistory(data.payments)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadDemands()
    loadPaymentHistory()
  }, [user, router, loadDemands, loadPaymentHistory])

  const handleRenew = async (demandId: string) => {
    setActionLoading(demandId)
    setErrorMsg('')
    try {
      const res = await fetch('/api/demands/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg('Annonce renouvelée pour 7 jours !')
        setTimeout(() => setSuccessMsg(''), 3000)
        loadDemands()
      } else {
        setErrorMsg(data.error || 'Erreur')
      }
    } catch {
      setErrorMsg('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkSold = async (demandId: string, isVente: boolean) => {
    setActionLoading(demandId)
    setErrorMsg('')
    try {
      const res = await fetch('/api/demands/sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(isVente ? 'Marqué comme vendu ! Vente +1' : 'Marqué comme acheté ! Achat +1')
        setTimeout(() => setSuccessMsg(''), 3000)
        await fetchUser()
        loadDemands()
      } else {
        setErrorMsg(data.error || 'Erreur')
      }
    } catch {
      setErrorMsg('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (demandId: string) => {
    if (!confirm('Supprimer cette annonce ? Cette action est irréversible.')) return
    setActionLoading(demandId)
    setErrorMsg('')
    try {
      const res = await fetch('/api/demands/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg('Annonce supprimée')
        setTimeout(() => setSuccessMsg(''), 3000)
        loadDemands()
      } else {
        setErrorMsg(data.error || 'Erreur')
      }
    } catch {
      setErrorMsg('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!user) return null

  const isVendeur = user.userType === 'vendeur'
  const hasSubscription = user.subscriptionTier === 'diambar' || user.subscriptionTier === 'king'
  const subscriptionBadge = user.subscriptionTier === 'king'
    ? '⭐ VIP KING'
    : user.subscriptionTier === 'diambar'
      ? '💎 Diambar'
      : null

  const activeAnnonces = demands.filter(d => d.status === 'active')
  const expiredAnnonces = demands.filter(d => d.status === 'expired')
  const soldAnnonces = demands.filter(d => d.status === 'sold')
  const activeVentes = demands.filter(d => d.status === 'active' && d.annonceType === 'vends')
  const maxVentes = isVendeur ? (VENDOR_ANNONCE_LIMITS[user.subscriptionTier || 'none'] ?? 0) : 0

  const getDaysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const now = new Date()
    const exp = new Date(expiresAt)
    const diff = exp.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* ─── PROFILE CARD ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-orange-dark to-orange h-24 relative">
          <div className="absolute -bottom-10 left-5">
            <div className="w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
              <User className="w-9 h-9 text-orange" />
            </div>
          </div>
        </div>

        <div className="pt-14 pb-5 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                {subscriptionBadge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    user.subscriptionTier === 'king'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-50 text-blue-900'
                  }`}>
                    {subscriptionBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="capitalize">{isVendeur ? '🛒 Vendeur' : '🔍 Acheteur'}</span>
                {!hasSubscription && isVendeur && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-medium">
                    Simple
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-orange-bg rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-orange" />
                <span className="text-xs text-gray-500">Points</span>
              </div>
              <div className="text-lg font-extrabold text-orange">
                {user.points.toLocaleString('fr-FR')}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-800" />
                <span className="text-xs text-gray-500">Ventes</span>
              </div>
              <div className="text-lg font-extrabold text-blue-800">
                {user.salesCount || 0}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="w-4 h-4 text-blue-800" />
                <span className="text-xs text-gray-500">Achats</span>
              </div>
              <div className="text-lg font-extrabold text-blue-800">
                {user.purchasesCount || 0}
              </div>
            </div>
          </div>

          {/* Subscription info */}
          {isVendeur && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Annonces de vente actives</span>
                <span className="font-bold text-orange">{activeVentes.length}/{maxVentes}</span>
              </div>
              {!hasSubscription && (
                <div className="mt-2">
                  <Link
                    href="/recharge"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange text-white rounded-lg font-bold text-xs"
                  >
                    <Crown className="w-3 h-3" /> Prendre un abonnement
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/recharge"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange hover:bg-orange-dark text-white rounded-lg font-bold text-xs"
            >
              <Zap className="w-3.5 h-3.5" /> Recharger
            </Link>
            <Link
              href="/deposer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-orange/30 text-orange rounded-lg font-bold text-xs hover:bg-orange-bg"
            >
              <Package className="w-3.5 h-3.5" /> Déposer une annonce
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE ANNOUNCES ─── */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-800" />
          Annonces actives ({activeAnnonces.length})
        </h2>

        {activeAnnonces.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune annonce active</p>
            <Link href="/deposer" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-orange text-white rounded-lg font-bold text-xs">
              Déposer une annonce
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAnnonces.map(demand => {
              const daysLeft = getDaysLeft(demand.expiresAt)
              const isVente = demand.annonceType === 'vends'
              const emoji = CATEGORY_EMOJIS[demand.category] || '📦'

              return (
                <div key={demand.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex gap-3">
                    {/* Emoji/photo */}
                    {demand.photo ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={demand.photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-orange-bg flex items-center justify-center shrink-0">
                        <span className="text-2xl">{emoji}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${isVente ? 'bg-orange' : 'bg-blue-800'}`}>
                              {isVente ? 'Je vends' : 'Je cherche'}
                            </span>
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{demand.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {demand.quartier}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {timeAgo(new Date(demand.createdAt))}
                            </span>
                          </div>
                        </div>
                        {/* Price */}
                        {(isVente && demand.price > 0) && (
                          <div className="text-orange font-extrabold text-sm shrink-0">
                            {formatFCFA(demand.price)}
                          </div>
                        )}
                        {(!isVente && demand.budget > 0) && (
                          <div className="text-orange font-extrabold text-sm shrink-0">
                            {formatFCFA(demand.budget)}
                          </div>
                        )}
                      </div>

                      {/* Expiry warning */}
                      {daysLeft !== null && (
                        <div className={`mt-1.5 text-[11px] font-medium ${
                          daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {daysLeft <= 0 ? 'Expire aujourd\'hui !' : daysLeft === 1 ? 'Expire demain' : `Expire dans ${daysLeft} jours`}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          onClick={() => handleMarkSold(demand.id, isVente)}
                          disabled={actionLoading === demand.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-indigo-100 text-blue-900 rounded-md text-[11px] font-bold disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {isVente ? 'Vendu' : 'Acheté'}
                        </button>
                        <button
                          onClick={() => handleDelete(demand.id)}
                          disabled={actionLoading === demand.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[11px] font-bold disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── PAYMENT HISTORY ─── */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-800" />
          Historique des paiements ({paymentHistory.length})
        </h2>

        {paymentHistory.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun paiement effectué</p>
            <Link href="/recharge" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-orange text-white rounded-lg font-bold text-xs">
              Recharger des points
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {paymentHistory.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      p.provider === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.provider === 'whatsapp' ? (
                        <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" /> WhatsApp</span>
                      ) : 'En ligne'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      p.status === 'completed' ? 'bg-green-50 text-green-600' :
                      p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {p.status === 'completed' ? '✅ Validé' : p.status === 'pending' ? '⏳ En attente' : '❌ Refusé'}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {p.type === 'points' ? '💎 Points' : '⭐ Abonnement'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatFCFA(p.amount)}</p>
                  <p className="text-[11px] text-gray-400">{new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {p.adminNote && p.status !== 'completed' && (
                    <p className="text-[11px] text-gray-500 italic mt-0.5">{p.adminNote}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  {p.status === 'pending' && (
                    <Link
                      href="/recharge"
                      className="text-[10px] text-amber-600 font-medium hover:underline"
                    >
                      Voir statut →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── EXPIRED ANNOUNCES ─── */}
      {expiredAnnonces.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Annonces expirées ({expiredAnnonces.length})
          </h2>

          <div className="space-y-3">
            {expiredAnnonces.map(demand => {
              const isVente = demand.annonceType === 'vends'
              const emoji = CATEGORY_EMOJIS[demand.category] || '📦'

              return (
                <div key={demand.id} className="bg-white rounded-xl border border-amber-200 p-4 opacity-75">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-2xl">{emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                          Expirée
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${isVente ? 'bg-orange' : 'bg-blue-800'}`}>
                          {isVente ? 'Je vends' : 'Je cherche'}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-700 truncate">{demand.title}</h3>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          onClick={() => handleRenew(demand.id)}
                          disabled={actionLoading === demand.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange hover:bg-orange-dark text-white rounded-md text-[11px] font-bold disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${actionLoading === demand.id ? 'animate-spin' : ''}`} />
                          Renouveler 7 jours
                        </button>
                        <button
                          onClick={() => handleDelete(demand.id)}
                          disabled={actionLoading === demand.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[11px] font-bold disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── SOLD ANNOUNCES ─── */}
      {soldAnnonces.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-800" />
            Terminé ({soldAnnonces.length})
          </h2>

          <div className="space-y-3">
            {soldAnnonces.map(demand => {
              const isVente = demand.annonceType === 'vends'
              const emoji = CATEGORY_EMOJIS[demand.category] || '📦'

              return (
                <div key={demand.id} className="bg-white rounded-xl border border-blue-200 p-4 opacity-60">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-2xl">{emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-blue-900">
                          {isVente ? 'Vendu ✓' : 'Acheté ✓'}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-500 truncate line-through">{demand.title}</h3>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        {timeAgo(new Date(demand.createdAt))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
