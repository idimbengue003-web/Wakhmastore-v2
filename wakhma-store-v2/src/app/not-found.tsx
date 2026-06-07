import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-orange mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page introuvable</p>
        <Link href="/" className="px-6 py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
