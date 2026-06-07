'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { SUBSCRIPTION_TIERS, formatFCFA } from '@/lib/constants'
import { CheckCircle, ArrowLeft, Zap, Crown, Star, X, MessageCircle, Phone, Send, Camera, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Step = 'select' | 'instructions' | 'form' | 'submitted'

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || '221771234567'

const WHATSAPP_LINKS = {
  diambar: () => {
    const msg = encodeURIComponent(
      `🔔 *Nouvelle commande Wakhma Store*\n\n` +
      `💎 *Abonnement Diambar*\n` +
      `💰 Montant : 5 000 FCFA\n` +
      `⏱ Durée : 30 jours\n\n` +
      `Je souhaite acheter cet abonnement. Voici mon numéro Wave pour le paiement :`
    )
    return `https://wa.me/${STORE_PHONE}?text=${msg}`
  },
  king: () => {
    const msg = encodeURIComponent(
      `🔔 *Nouvelle commande Wakhma Store*\n\n` +
      `⭐ *Abonnement VIP KING*\n` +
      `💰 Montant : 10 000 FCFA\n` +
      `⏱ Durée : 30 jours\n\n` +
      `Je souhaite acheter cet abonnement. Voici mon numéro Wave pour le paiement :`
    )
    return `https://wa.me/${STORE_PHONE}?text=${msg}`
  },
}

export default function AbonnementsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [error, setError] = useState('')

  const [step, setStep] = useState<Step>('select')
  const [selectedPayment, setSelectedPayment] = useState<{
    tierId: string
    amount: number
    label: string
  } | null>(null)

  const [senderPhone, setSenderPhone] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [submittedData, setSubmittedData] = useState<{
    orderReference: string
    whatsappUrl: string
    amount: number
    label: string
  } | null>(null)

  const handleSelectPayment = (tierId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId)!
    setSelectedPayment({ tierId, amount: tier.price, label: `Abonnement ${tier.name}` })
    setStep('instructions')
    setError('')
  }

  const handleSubmitProof = async () => {
    if (!selectedPayment || !senderPhone.trim()) {
      setError('Le numéro de téléphone est obligatoire')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payment/whatsapp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          tierIndex: -1,
          tierId: selectedPayment.tierId,
          senderPhone: senderPhone.trim(),
          senderName: senderName.trim(),
          transactionId: transactionId.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmittedData({
          orderReference: data.orderReference,
          whatsappUrl: data.whatsappUrl,
          amount: data.amount,
          label: data.label,
        })
        setStep('submitted')
      } else {
        setError(data.error || 'Erreur lors de la soumission')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedPayment(null)
    setSenderPhone('')
    setSenderName('')
    setTransactionId('')
    setSubmittedData(null)
    setError('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-3">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Abonnements
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Active un abonnement pour poster des annonces &quot;Je vends&quot; et profiter d&apos;avantages exclusifs
        </p>
        {user && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-bg border border-orange/20 rounded-lg">
            <Zap className="w-4 h-4 text-orange" />
            <span className="text-sm font-medium text-orange-dark">
              Solde : {user.points.toLocaleString('fr-FR')} pts
            </span>
            {user.subscriptionTier && (
              <span className="text-sm">
                {user.subscriptionTier === 'king' ? '⭐ VIP KING actif' : '💎 Diambar actif'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Already subscribed notice */}
      {user?.subscriptionTier && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <p className="font-semibold mb-1">✅ Tu as déjà un abonnement actif</p>
          <p>
            {user.subscriptionTier === 'king' ? '⭐ VIP KING' : '💎 Diambar'}
            {user.subscriptionEnd && ` — expire le ${new Date(user.subscriptionEnd).toLocaleDateString('fr-FR')}`}
          </p>
          <p className="text-xs text-green-600 mt-1">Tu peux quand même souscrire à un autre abonnement pour prolonger ou upgrader.</p>
        </div>
      )}

      {/* Payment method banner */}
      <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span>
          Paiement via <strong>Wave</strong> — Cliquez sur le bouton WhatsApp, envoyez l&apos;argent et votre commande sera validée !
        </span>
      </div>

      {/* Need points? */}
      <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
        <span>Tu veux juste recharger des points ?</span>
        <Link href="/recharge" className="font-semibold text-orange hover:underline ml-2 shrink-0">
          Recharger des points →
        </Link>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span className="break-words">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══ STEP: SELECT ═══ */}
      {step === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl border-2 overflow-hidden ${
                tier.id === 'king' ? 'border-yellow-400 shadow-lg shadow-yellow-100' : 'border-orange/30'
              }`}
            >
              {tier.id === 'king' && (
                <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1.5 text-center">
                  ⭐ POPULAIRE — Meilleur rapport qualité/prix
                </div>
              )}
              <div className="p-6">
                <div className="text-4xl mb-2">{tier.badge}</div>
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{formatFCFA(tier.price)}</span>
                  <span className="text-sm text-gray-500"> / {tier.durationDays} jours</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${tier.id === 'king' ? 'text-yellow-500' : 'text-orange'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.id === 'diambar' ? WHATSAPP_LINKS.diambar() : WHATSAPP_LINKS.king()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {tier.id === 'king' ? (
                    <><Crown className="w-4 h-4" /> Commander VIP KING</>
                  ) : (
                    <><Star className="w-4 h-4" /> Commander Diambar</>
                  )}
                </a>

                <button
                  onClick={() => handleSelectPayment(tier.id)}
                  className="w-full mt-2 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ou soumettre une preuve en ligne
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ STEP: INSTRUCTIONS ═══ */}
      {step === 'instructions' && selectedPayment && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-800 text-white p-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Instructions de paiement Wave
              </h2>
              <p className="text-blue-200 text-sm mt-1">Étape 1 sur 2 — Envoyez l&apos;argent via Wave</p>
            </div>
            <div className="p-5 border-b border-gray-100">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Montant à envoyer</p>
                <p className="text-3xl font-extrabold text-blue-800">{formatFCFA(selectedPayment.amount)}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedPayment.label}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" /> Envoyez via Wave à ce numéro :
                </h3>
                <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-sm text-gray-500">Numéro Wave du store</p>
                  <p className="text-2xl font-bold text-blue-800 tracking-wide">{process.env.NEXT_PUBLIC_STORE_WAVE_NUMBER || '77 123 45 67'}</p>
                  <p className="text-xs text-gray-500 mt-1">Wakhma Store</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <button onClick={() => setStep('form')} className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> J&apos;ai envoyé l&apos;argent — Suivant
              </button>
              <button onClick={handleReset} className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP: FORM ═══ */}
      {step === 'form' && selectedPayment && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-600 text-white p-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5" /> Confirmez votre paiement
              </h2>
              <p className="text-green-200 text-sm mt-1">Étape 2 sur 2 — Soumettez votre preuve</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-green-800">Montant :</span>
                <span className="font-bold text-green-800">{formatFCFA(selectedPayment.amount)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-4 h-4 inline mr-1" /> Votre numéro Wave <span className="text-red-500">*</span>
                </label>
                <input type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="77 123 45 67" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Votre nom (optionnel)</label>
                <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Amadou Diallo" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ID de transaction Wave (optionnel)</label>
                <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Ex: 8a7b6c5d4e3f..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Votre paiement sera vérifié par un administrateur. Vous recevrez votre abonnement dès la validation.</p>
              </div>
            </div>
            <div className="p-5 pt-0 space-y-3">
              <button onClick={handleSubmitProof} disabled={submitting || !senderPhone.trim()} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Send className="w-4 h-4" /> Soumettre la preuve</>}
              </button>
              <button onClick={() => setStep('instructions')} className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                ← Retour aux instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP: SUBMITTED ═══ */}
      {step === 'submitted' && submittedData && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-800 text-white p-5 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold">Preuve soumise avec succès !</h2>
              <p className="text-blue-200 text-sm mt-1">Référence : {submittedData.orderReference}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant :</span>
                  <span className="font-bold text-blue-800">{formatFCFA(submittedData.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type :</span>
                  <span className="font-medium text-gray-900">{submittedData.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Statut :</span>
                  <span className="flex items-center gap-1 font-medium text-amber-600">
                    <Clock className="w-3.5 h-3.5" /> En attente de validation
                  </span>
                </div>
              </div>
              <a href={submittedData.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Confirmer via WhatsApp
              </a>
            </div>
            <div className="p-5 pt-0 space-y-3">
              <Link href="/deposer" className="w-full py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                Déposer une annonce
              </Link>
              <button onClick={handleReset} className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 text-center">
          Connecte-toi pour acheter un abonnement.{' '}
          <Link href="/login" className="font-semibold text-orange">Se connecter</Link>
        </div>
      )}
    </div>
  )
}
