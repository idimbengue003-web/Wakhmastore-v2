'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { RegisterForm } from '@/components/AuthForms'
import { Store } from 'lucide-react'
import { Suspense } from 'react'

function RegisterContent() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange rounded-2xl mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inscription</h1>
          <p className="text-gray-500 mt-1">Crée ton compte Wakhma Store</p>
          {refCode && (
            <p className="mt-2 text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg inline-block font-medium">
              🎁 Code de parrainage détecté ! +2 000 pts à l'inscription
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <RegisterForm referralCode={refCode || undefined} />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="font-semibold text-orange hover:text-orange-dark">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-orange border-t-transparent rounded-full" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
