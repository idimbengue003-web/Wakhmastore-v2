'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { CATEGORIES, QUARTIERS, URGENCY_OPTIONS, CATEGORY_EMOJIS, containsPhoneInText, VENDOR_ANNONCE_LIMITS } from '@/lib/constants'
import { AlertTriangle, Camera, CheckCircle, ArrowLeft, X, Store, Search } from 'lucide-react'
import Link from 'next/link'

export default function DeposerPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  // Determine what the user can do
  const isVendeur = user?.userType === 'vendeur'
  const hasSubscription = user?.subscriptionTier === 'diambar' || user?.subscriptionTier === 'king'
  const canSell = isVendeur && hasSubscription
  const maxVentes = isVendeur ? (VENDOR_ANNONCE_LIMITS[user?.subscriptionTier || 'none'] ?? 0) : 0

  const [annonceType, setAnnonceType] = useState<'cherche' | 'vends'>(canSell ? 'vends' : 'cherche')
  const [activeVentes, setActiveVentes] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Autre')
  const [budget, setBudget] = useState('')
  const [price, setPrice] = useState('')
  const [quartier, setQuartier] = useState('Dakar')
  const [urgency, setUrgency] = useState('flexible')
  const [whatsapp, setWhatsapp] = useState(user?.phone ? user.phone : '')
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [phoneWarning, setPhoneWarning] = useState(false)

  // Count active ventes for this vendeur
  useEffect(() => {
    if (!canSell) return
    async function count() {
      try {
        const res = await fetch('/api/demands?annonceType=vends')
        if (res.ok) {
          const data = await res.json()
          const mine = data.demands.filter((d: { userName: string }) => d.userName === user?.name)
          setActiveVentes(mine.length)
        }
      } catch { /* silent */ }
    }
    count()
  }, [canSell, user?.name])

  const checkPhone = (text: string) => {
    setPhoneWarning(containsPhoneInText(text))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      const budgetNum = budget ? parseInt(budget.replace(/\D/g, '')) : 0
      const priceNum = price ? parseInt(price.replace(/\D/g, '')) : 0

      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          budget: annonceType === 'cherche' ? budgetNum : 0,
          price: annonceType === 'vends' ? priceNum : 0,
          quartier,
          urgency,
          whatsapp,
          photo,
          annonceType,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.detail ? `${data.error} : ${data.detail}` : (data.error || 'Erreur lors de la création'))
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-lg border border-orange/20 p-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-blue-800" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Annonce publiée !</h2>
          <p className="text-sm text-gray-500 mb-6">
            {annonceType === 'vends'
              ? 'Ton annonce de vente est visible par tous les acheteurs de Dakar. Elle expirera dans 7 jours, renouvelable depuis ton profil.'
              : 'Ton annonce est visible par tous les vendeurs de Dakar. Elle expirera dans 7 jours, renouvelable depuis ton profil.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/annonces" className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-xl font-medium text-sm">
              Voir les annonces
            </Link>
            <button
              onClick={() => {
                setSuccess(false)
                setTitle('')
                setDescription('')
                setBudget('')
                setPrice('')
                setWhatsapp(user?.phone || '')
                setPhoto(null)
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Publier une autre
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-3">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Déposer une annonce
        </h1>
      </div>

      {/* ─── Vendeur simple: message d'info ─── */}
      {isVendeur && !hasSubscription && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-bold mb-1">🔓 Vendeur simple</p>
          <p>Tu peux répondre aux demandes d&apos;acheteurs, mais tu ne peux pas poster d&apos;annonces &quot;Je vends&quot;.</p>
          <Link href="/recharge" className="inline-block mt-2 px-4 py-2 bg-orange text-white rounded-lg font-bold text-xs">
            Prendre un abonnement 💎⭐
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {phoneWarning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Les numéros de téléphone seront automatiquement masqués.
          </div>
        )}

        {/* ─── Type d'annonce (vendeur abonné seulement) ─── */}
        {canSell && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d&apos;annonce</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnnonceType('cherche')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  annonceType === 'cherche'
                    ? 'border-orange bg-orange-bg'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Search className={`w-5 h-5 mx-auto mb-1 ${annonceType === 'cherche' ? 'text-orange' : 'text-gray-400'}`} />
                <div className={`text-xs font-bold ${annonceType === 'cherche' ? 'text-orange' : 'text-gray-600'}`}>
                  Je cherche
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAnnonceType('vends')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  annonceType === 'vends'
                    ? 'border-orange bg-orange-bg'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Store className={`w-5 h-5 mx-auto mb-1 ${annonceType === 'vends' ? 'text-orange' : 'text-gray-400'}`} />
                <div className={`text-xs font-bold ${annonceType === 'vends' ? 'text-orange' : 'text-gray-600'}`}>
                  Je vends
                  {user?.subscriptionTier === 'king' && ' ⭐'}
                  {user?.subscriptionTier === 'diambar' && ' 💎'}
                </div>
              </button>
            </div>
            {annonceType === 'vends' && (
              <p className="text-[11px] text-gray-500 mt-1.5">
                {activeVentes}/{maxVentes} annonces de vente actives
              </p>
            )}
          </div>
        )}

        {/* Acheteur: locked to "Je cherche" */}
        {!isVendeur && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            🔍 Mode acheteur — Tu postes une demande &quot;Je cherche&quot;
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-2 rounded-xl text-xs font-medium text-center ${
                  category === cat
                    ? 'bg-orange-bg text-orange border-2 border-orange'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="block text-lg mb-0.5">{CATEGORY_EMOJIS[cat] || '📦'}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {annonceType === 'vends' ? 'Je vends...' : 'Je cherche...'} *
          </label>
          <div className="flex items-center">
            <span className="px-3 py-3 bg-orange-bg text-orange font-medium text-sm rounded-l-xl border border-r-0 border-gray-300">
              {annonceType === 'vends' ? 'Je vends' : 'Je cherche'}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={annonceType === 'vends' ? 'un iPhone 14, un frigo Samsung...' : 'un iPhone 14, un frigo Samsung...'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
              required
            />
          </div>
        </div>

        {/* Price (vends only) */}
        {annonceType === 'vends' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (FCFA)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 150000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
            />
          </div>
        )}

        {/* Urgency */}
        {annonceType === 'cherche' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgence</label>
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`p-3 rounded-xl text-left ${
                    urgency === opt.value
                      ? 'bg-orange-bg border-2 border-orange'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); checkPhone(e.target.value) }}
            placeholder={annonceType === 'vends'
              ? 'Décris ton produit : état, marque, modèle, couleur...'
              : 'Décris ce que tu cherches en détail...'}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm resize-none"
            required
          />
        </div>

        {/* Budget (cherche only) */}
        {annonceType === 'cherche' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (FCFA)</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex: 150000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
            />
          </div>
        )}

        {/* Quartier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
          <select
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm bg-white"
          >
            <option value="Dakar">Dakar (tous)</option>
            {QUARTIERS.map((q) => (<option key={q} value={q}>{q}</option>))}
          </select>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro WhatsApp *</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="77 123 45 67"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange outline-none text-sm"
            required
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optionnel)</label>
          {photo ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange hover:bg-orange-bg cursor-pointer">
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Ajouter une photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Submit */}
        {!user ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 text-center">
            Connecte-toi pour déposer une annonce.{' '}
            <Link href="/login" className="font-semibold text-orange">Se connecter</Link>
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange hover:bg-orange-dark text-white rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Publication...' : `Publier "${annonceType === 'vends' ? 'Je vends' : 'Je cherche'}"`}
          </button>
        )}
      </form>
    </div>
  )
}
