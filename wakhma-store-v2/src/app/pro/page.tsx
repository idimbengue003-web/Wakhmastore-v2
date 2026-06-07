import Link from 'next/link'
import { Store, BarChart3, Package } from 'lucide-react'

export default function ProPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace Pro</h1>
      <p className="text-gray-500 mb-6">Gérez vos annonces et suivez vos performances</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/profil" className="p-5 bg-white rounded-xl border border-gray-200 hover:border-orange/30 hover:shadow-md transition-all">
          <Package className="w-8 h-8 text-orange mb-3" />
          <h2 className="font-semibold text-gray-900">Mes annonces</h2>
          <p className="text-xs text-gray-500 mt-1">Gérer vos annonces actives, expirées et vendues</p>
        </Link>
        <Link href="/abonnements" className="p-5 bg-white rounded-xl border border-gray-200 hover:border-orange/30 hover:shadow-md transition-all">
          <Store className="w-8 h-8 text-orange mb-3" />
          <h2 className="font-semibold text-gray-900">Abonnements</h2>
          <p className="text-xs text-gray-500 mt-1">Souscrire ou gérer votre abonnement vendeur</p>
        </Link>
      </div>
    </div>
  )
}
