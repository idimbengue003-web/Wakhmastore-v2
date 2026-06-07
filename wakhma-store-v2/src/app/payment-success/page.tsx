'use client'

import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement enregistré !</h1>
        <p className="text-gray-500 mb-4">
          Votre preuve de paiement a été soumise. Un administrateur la vérifiera sous peu.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Vos points/abonnement seront crédités dès la validation (généralement en quelques minutes).</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/annonces" className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-medium text-sm">
            Voir les annonces
          </Link>
          <Link href="/profil" className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  )
}
