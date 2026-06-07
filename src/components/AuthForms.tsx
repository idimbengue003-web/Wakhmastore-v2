'use client'

import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, Store } from 'lucide-react'

export function LoginForm() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchUser } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchUser()
        router.push('/')
      } else {
        setError(data.detail ? `${data.error} : ${data.detail}` : (data.error || 'Erreur de connexion'))
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="77 123 45 67"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Votre mot de passe"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-semibold text-sm disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}

export function RegisterForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'acheteur' | 'vendeur'>('acheteur')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchUser } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, userType }),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchUser()
        router.push('/')
      } else {
        setError(data.detail ? `${data.error} : ${data.detail}` : (data.error || 'Erreur d\'inscription'))
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      {/* Choix du type de compte */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Je suis...</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUserType('acheteur')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              userType === 'acheteur'
                ? 'border-orange bg-orange-bg'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <Search className={`w-6 h-6 mx-auto mb-2 ${userType === 'acheteur' ? 'text-orange' : 'text-gray-400'}`} />
            <div className={`text-sm font-bold ${userType === 'acheteur' ? 'text-orange' : 'text-gray-700'}`}>
              Acheteur
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Je cherche des objets à acheter
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUserType('vendeur')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              userType === 'vendeur'
                ? 'border-orange bg-orange-bg'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <Store className={`w-6 h-6 mx-auto mb-2 ${userType === 'vendeur' ? 'text-orange' : 'text-gray-400'}`} />
            <div className={`text-sm font-bold ${userType === 'vendeur' ? 'text-orange' : 'text-gray-700'}`}>
              Vendeur
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Je veux vendre mes produits
            </div>
          </button>
        </div>
        {userType === 'vendeur' && (
          <p className="text-[11px] text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg">
            💡 Vendeur simple : tu peux répondre aux demandes. Pour poster des annonces &quot;Je vends&quot;, prends un abonnement Diambar ou VIP KING.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="77 123 45 67"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Au moins 4 caractères"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
          required
          minLength={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-semibold text-sm disabled:opacity-50"
      >
        {loading ? 'Inscription...' : 'Créer mon compte'}
      </button>
    </form>
  )
}
