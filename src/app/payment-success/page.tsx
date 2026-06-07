'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Zap, Crown, Star, Loader2, Clock, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const { fetchUser } = useAuthStore()
  const [loaded, setLoaded] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'completed' | 'pending' | 'whatsapp_pending'>('loading')
  const [paymentInfo, setPaymentInfo] = useState<{
    type: string
    amount: number
    tierId: string | null
    orderRef: string | null
  } | null>(null)

  const orderRef = searchParams.get('orderRef')
  const whatsappPending = searchParams.get('whatsapp')

  const checkPaymentStatus = async (ref: string) => {
    try {
      const res = await fetch(`/api/payment/senepay/status?orderRef=${encodeURIComponent(ref)}`)
      if (!res.ok) {
        setPaymentStatus('pending')
        return
      }

      const data = await res.json()
      setPaymentInfo({
        type: data.type,
        amount: data.amount,
        tierId: data.tierId,
        orderRef: data.orderReference,
      })

      if (data.status === 'completed') {
        // Payment validated by admin
        setPaymentStatus('completed')
        await fetchUser()
      } else {
        // Still pending admin validation
        setPaymentStatus('whatsapp_pending')
      }
    } catch {
      setPaymentStatus('pending')
    }
  }

  useEffect(() => {
    // Refresh user data
    fetchUser().then(() => setLoaded(true))

    // WhatsApp pending flow
    if (whatsappPending === 'pending') {
      setPaymentStatus('whatsapp_pending')
      setPaymentInfo({
        type: searchParams.get('type') || 'points',
        amount: Number(searchParams.get('amount')) || 0,
        tierId: searchParams.get('tierId'),
        orderRef: searchParams.get('orderRef'),
      })
      return
    }

    // Check payment status from our DB only (no SenePay polling)
    if (orderRef) {
      checkPaymentStatus(orderRef)
    } else {
      // No order reference — show pending state
      setPaymentStatus('pending')
    }
  }, [orderRef, whatsappPending, fetchUser])

  const type = searchParams.get('type') || paymentInfo?.type
  const added = searchParams.get('added')
  const balance = searchParams.get('balance')
  const tier = searchParams.get('tier') || paymentInfo?.tierId
  const bonus = searchParams.get('bonus')

  const isPoints = type === 'points'
  const isSubscription = type === 'subscription'

  // ─── Loading State ───
  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-800 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérification du paiement...</h2>
          <p className="text-sm text-gray-500">Nous vérifions le statut de votre paiement.</p>
        </div>
      </div>
    )
  }

  // ─── Pending / Awaiting Admin Validation ───
  if (paymentStatus === 'whatsapp_pending' || paymentStatus === 'pending') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement en attente de validation</h2>
          <p className="text-sm text-gray-500 mb-4">
            Votre preuve de paiement a été enregistrée. Un administrateur va la vérifier et créditer votre compte sous peu.
          </p>
          {paymentInfo?.amount ? (
            <p className="text-lg font-bold text-blue-800 mb-2">
              {new Intl.NumberFormat('fr-FR').format(paymentInfo.amount)} FCFA
            </p>
          ) : null}
          {paymentInfo?.orderRef && (
            <p className="text-xs text-gray-400 font-mono mb-4">Réf : {paymentInfo.orderRef}</p>
          )}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-center gap-2 justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Confirmez aussi via WhatsApp pour accélérer !
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/annonces"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Voir les annonces
            </Link>
            <Link
              href="/profil"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Mon profil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Completed (Admin Validated) ───
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-blue-800" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement validé !
        </h1>

        {isPoints && added && (
          <>
            <p className="text-gray-600 mb-1">
              <span className="text-3xl font-extrabold text-orange">{Number(added).toLocaleString('fr-FR')}</span>
              <span className="text-lg font-semibold text-gray-500 ml-1">points</span>
            </p>
            <p className="text-sm text-gray-500">
              Nouveau solde : <span className="font-bold text-orange">{Number(balance).toLocaleString('fr-FR')} pts</span>
            </p>
          </>
        )}

        {isSubscription && tier && (
          <>
            <div className="text-4xl mb-2">
              {tier === 'king' ? '⭐' : '💎'}
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              Abonnement {tier === 'king' ? 'VIP KING' : 'Diambar'} activé !
            </p>
            {bonus && (
              <p className="text-sm text-gray-500">
                <span className="font-bold text-orange">{Number(bonus).toLocaleString('fr-FR')} points</span> offerts
              </p>
            )}
            {balance && (
              <p className="text-sm text-gray-500 mt-1">
                Solde : <span className="font-bold">{Number(balance).toLocaleString('fr-FR')} pts</span>
              </p>
            )}
          </>
        )}

        {/* Generic success when no specific params */}
        {isPoints && !added && (
          <p className="text-gray-600 mb-2">
            Vos points ont été crédités sur votre compte.
          </p>
        )}

        {isSubscription && !tier && (
          <p className="text-gray-600 mb-2">
            Votre abonnement a été activé avec succès.
          </p>
        )}

        {!type && (
          <p className="text-gray-600 mb-2">
            Votre paiement a été validé par l&apos;administrateur.
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/deposer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm"
          >
            <Zap className="w-4 h-4" /> Déposer une annonce
          </Link>
          <Link
            href="/profil"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50"
          >
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
