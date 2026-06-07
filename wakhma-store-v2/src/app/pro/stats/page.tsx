import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ProStatsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/pro" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistiques</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        <p className="text-sm">Les statistiques détaillées seront bientôt disponibles.</p>
      </div>
    </div>
  )
}
