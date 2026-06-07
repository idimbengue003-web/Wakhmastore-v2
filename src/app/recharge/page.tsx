'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { POINTS_TIERS, SUBSCRIPTION_TIERS, formatFCFA } from '@/lib/constants'
import {
  Zap, Crown, Star, CheckCircle, ArrowRight, CreditCard, Phone,
  MessageCircle, Shield, Clock, Package, Sparkles, Gift
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RechargePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'points' | 'abonnements'>('points')
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<'select' | 'whatsapp' | 'done'>('select')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderName, setSenderName] = useState(user?.name || '')
  const [transactionId, setTransactionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderRef, setOrderRef] = useState('')

  const handlePayment = async () => {
    if (!user) { router.push('/login'); return }
    if (!senderPhone.trim() || senderPhone.trim().length < 8) {
      setError('Numéro de téléphone Wave requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      const isPoints = activeTab === 'points'
      const res = await fetch('/api/payment/whatsapp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isPoints ? 'points' : 'subscription',
          tierIndex: isPoints ? selectedTier : undefined,
          tierId: !isPoints ? selectedSub : undefined,
          senderPhone: senderPhone.trim(),
          senderName: senderName?.trim() || undefined,
          transactionId: transactionId?.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setOrderRef(data.orderReference)
        setPaymentStep('done')
        // Open WhatsApp with pre-filled message
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank')
        }
      } else {
        setError(data.error || 'Erreur lors du paiement')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const currentTier = activeTab === 'points' && selectedTier !== null ? POINTS_TIERS[selectedTier] : null
  const currentSub = activeTab === 'abonnements' && selectedSub ? SUBSCRIPTION_TIERS.find(t => t.id === selectedSub) : null
  const amount = currentTier?.prix || currentSub?.price || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange rounded-2xl mb-4 shadow-lg shadow-orange/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 gradient-text">
            Recharger & Abonnements
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Achète des points pour contacter les vendeurs ou prends un abonnement pour débloquer plus de fonctionnalités.
          </p>
        </div>

        {/* Balance card */}
        {user && (
          <div className="bg-gradient-to-r from-orange-dark to-orange rounded-2xl p-5 mb-6 text-white shadow-lg shadow-orange/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">Votre solde</p>
                <p className="text-3xl font-extrabold mt-1">
                  {user.points?.toLocaleString('fr-FR') ?? 0} <span className="text-base font-medium text-white/80">pts</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user.subscriptionTier === 'king' && (
                  <span className="px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-300" /> VIP KING
                  </span>
                )}
                {user.subscriptionTier === 'diambar' && (
                  <span className="px-3 py-1.5 bg-blue-400/20 border border-blue-400/30 rounded-lg text-xs font-bold flex items-center gap-1">
                    💎 Diambar
                  </span>
                )}
                {!user.subscriptionTier && (
                  <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-medium">
                    Gratuit
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-6 shadow-sm">
          <button
            onClick={() => { setActiveTab('points'); setSelectedTier(null); setPaymentStep('select') }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'points'
                ? 'bg-orange text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" /> Points
          </button>
          <button
            onClick={() => { setActiveTab('abonnements'); setSelectedSub(null); setPaymentStep('select') }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'abonnements'
                ? 'bg-orange text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Crown className="w-4 h-4" /> Abonnements
          </button>
        </div>

        {/* Points tiers */}
        {activeTab === 'points' && paymentStep === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {POINTS_TIERS.map((tier, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTier(index)}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all group ${
                    selectedTier === index
                      ? 'border-orange bg-orange-bg shadow-md shadow-orange/10'
                      : 'border-gray-200 bg-white hover:border-orange/30 hover:shadow-sm'
                  }`}
                >
                  {/* Popular badge */}
                  {index === 2 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange text-white text-[10px] font-bold rounded-full shadow-sm">
                      🔥 Populaire
                    </span>
                  )}
                  {index === 3 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-dark text-white text-[10px] font-bold rounded-full shadow-sm">
                      ⚡ Meilleur rapport
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange" />
                    </div>
                    {selectedTier === index && (
                      <CheckCircle className="w-5 h-5 text-orange" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{tier.label}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-orange">
                    {tier.points.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">points</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-base font-bold text-gray-900">{formatFCFA(tier.prix)}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* How points work */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange" /> Comment ça marche ?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-orange-bg rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-orange">1</div>
                  <p className="text-xs text-gray-600">Achète des points via Wave</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-orange-bg rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-orange">2</div>
                  <p className="text-xs text-gray-600">Utilise tes points pour voir les numéros WhatsApp</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-orange-bg rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-orange">3</div>
                  <p className="text-xs text-gray-600">Contacte directement les vendeurs</p>
                </div>
              </div>
            </div>

            {selectedTier !== null && (
              <button
                onClick={() => { if (!user) router.push('/login'); else setPaymentStep('whatsapp') }}
                className="w-full py-4 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange/20 transition-all"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Subscription tiers */}
        {activeTab === 'abonnements' && paymentStep === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedSub(tier.id)}
                  className={`relative p-5 sm:p-6 rounded-2xl border-2 text-left transition-all ${
                    selectedSub === tier.id
                      ? 'border-orange bg-orange-bg shadow-lg shadow-orange/10 pulse-glow'
                      : 'border-gray-200 bg-white hover:border-orange/30 hover:shadow-sm'
                  }`}
                >
                  {tier.id === 'king' && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full shadow-sm">
                      ⭐ Le plus populaire
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{tier.badge}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{tier.name}</h3>
                        <p className="text-xs text-gray-500">{tier.durationDays} jours</p>
                      </div>
                    </div>
                    {selectedSub === tier.id && (
                      <CheckCircle className="w-5 h-5 text-orange" />
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-orange">{formatFCFA(tier.price)}</span>
                    <span className="text-xs text-gray-500"> / mois</span>
                  </div>

                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.revealPrice < 1000 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Révélation à {tier.revealPrice} pts au lieu de 1 000 pts
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Comparison */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pourquoi prendre un abonnement ?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">Badge vérifié qui inspire confiance aux acheteurs</p>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">3 annonces &quot;Je vends&quot; actives en simultané</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">Révélation de numéro à prix réduit</p>
                </div>
              </div>
            </div>

            {selectedSub && (
              <button
                onClick={() => { if (!user) router.push('/login'); else setPaymentStep('whatsapp') }}
                className="w-full py-4 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange/20 transition-all"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* WhatsApp payment step */}
        {paymentStep === 'whatsapp' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Payment header */}
              <div className="bg-gradient-to-r from-orange-dark to-orange p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold">Paiement via Wave</h3>
                    <p className="text-xs text-white/80">Sécurisé et rapide</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/70">Montant à payer</p>
                  <p className="text-2xl font-extrabold">{formatFCFA(amount)}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-5 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-green-800 text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Instructions
                  </h4>
                  <ol className="text-xs text-green-700 space-y-1.5 list-decimal list-inside">
                    <li>Ouvrez votre application <strong>Wave</strong></li>
                    <li>Envoyez <strong>{formatFCFA(amount)}</strong> au numéro indiqué</li>
                    <li>Remplissez le formulaire ci-dessous</li>
                    <li>Un administrateur validera votre paiement</li>
                  </ol>
                </div>

                {/* Store Wave info */}
                <div className="bg-orange-bg rounded-xl p-3 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Numéro Wave du store</p>
                    <p className="font-bold text-gray-900">+221 77 123 45 67</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {error}
                  </div>
                )}

                {/* Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Votre numéro Wave * <span className="text-gray-400">(celui depuis lequel vous envoyez)</span>
                    </label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="77 123 45 67"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Votre nom</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Votre nom complet"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ID de transaction Wave <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Ex: WVE-123456789"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep('select')}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange/20 transition-all"
                  >
                    {loading ? 'Envoi...' : (
                      <>
                        <MessageCircle className="w-4 h-4" /> Confirmer & Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment done step */}
        {paymentStep === 'done' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement envoyé !</h2>
              <p className="text-sm text-gray-500 mb-4">
                Votre preuve de paiement a été enregistrée. Un administrateur la vérifiera sous peu et vos points/abonnement seront activés automatiquement.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Référence</span>
                  <span className="font-mono font-medium text-gray-900">{orderRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant</span>
                  <span className="font-bold text-orange">{formatFCFA(amount)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Vous recevrez une notification dès que votre paiement sera validé. Cela prend généralement quelques minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/annonces"
                  className="flex-1 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm text-center"
                >
                  Voir les annonces
                </Link>
                <Link
                  href="/profil"
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 text-center"
                >
                  Mon profil
                </Link>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-6 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              Vous devez être connecté pour recharger.{' '}
              <Link href="/login" className="font-semibold text-orange underline">Se connecter</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
