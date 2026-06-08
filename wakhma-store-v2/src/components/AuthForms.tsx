'use client'

import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Store, Loader2 } from 'lucide-react'

const GOOGLE_CLIENT_ID = '645891430275-48re5e0v1nagsnei4al8pel4ff9dknq1.apps.googleusercontent.com'

// ─── Google GIS script loader (singleton) ───────────────────────────────
let gisLoadPromise: Promise<void> | null = null
let gisLoaded = false

function loadGoogleGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (gisLoaded && window.google?.accounts?.id) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(check); gisLoaded = true; resolve() }
      }, 100)
      setTimeout(() => { clearInterval(check); gisLoaded ? resolve() : (gisLoadPromise = null, reject(new Error('timeout'))) }, 10_000)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(check); gisLoaded = true; resolve() }
      }, 50)
      setTimeout(() => { clearInterval(check); gisLoaded ? resolve() : (gisLoadPromise = null, reject(new Error('init timeout'))) }, 5_000)
    }
    script.onerror = () => { gisLoadPromise = null; reject(new Error('load failed')) }
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

// ─── Google SVG Icon ────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Google Sign-In Button ──────────────────────────────────────────────
// Strategy: custom button always visible → on click → prompt() → fallback OAuth2 popup
interface GoogleSignInButtonProps {
  onSuccess: () => void
  onError: (error: string) => void
}

function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'submitting'>('idle')
  const initializedRef = useRef(false)
  const callbackRef = useRef(onSuccess)
  const errorRef = useRef(onError)

  useEffect(() => { callbackRef.current = onSuccess }, [onSuccess])
  useEffect(() => { errorRef.current = onError }, [onError])

  // Handle the credential returned by Google
  const handleCredential = useCallback(async (credential: string) => {
    setStatus('submitting')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await res.json()
      if (res.ok) {
        callbackRef.current()
      } else {
        errorRef.current(data.error || 'Erreur de connexion Google')
      }
    } catch {
      errorRef.current('Erreur de connexion au serveur')
    } finally {
      setStatus('idle')
    }
  }, [])

  // Initialize GIS (call once)
  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    if (initializedRef.current && window.google?.accounts?.id) return true

    try {
      await loadGoogleGisScript()
    } catch {
      return false
    }

    if (!window.google?.accounts?.id) return false

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            handleCredential(response.credential)
          } else {
            errorRef.current('Réponse Google invalide')
            setStatus('idle')
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      })
      initializedRef.current = true
    }

    return true
  }, [handleCredential])

  // OAuth2 popup fallback (when GIS prompt doesn't work)
  const openOAuth2Popup = useCallback(() => {
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(authUrl, 'google-signin', `width=${width},height=${height},left=${left},top=${top}`)

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'google_oauth_callback') return
      window.removeEventListener('message', handleMessage)

      if (event.data.error) {
        errorRef.current(event.data.error)
        setStatus('idle')
        return
      }

      if (event.data.credential) {
        await handleCredential(event.data.credential)
      } else {
        errorRef.current('Connexion Google échouée')
        setStatus('idle')
      }
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setStatus('idle')
      }
    }, 500)
  }, [handleCredential])

  // Main click handler
  const handleClick = useCallback(async () => {
    setStatus('loading')

    const ready = await ensureInitialized()

    if (!ready) {
      // GIS completely unavailable → OAuth2 popup
      openOAuth2Popup()
      return
    }

    // Try the One Tap prompt
    try {
      const googleId = window.google?.accounts?.id
      if (!googleId) { openOAuth2Popup(); return }

      googleId.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Prompt blocked by browser → open OAuth2 popup instead
          console.warn('Google prompt skipped:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.())
          openOAuth2Popup()
        }
        // If prompt is shown, the callback will handle the rest
        // Only reset status if prompt was skipped AND popup not opened
        if (!notification.isNotDisplayed() && !notification.isSkippedMoment()) {
          // Prompt is displayed — user is interacting with Google UI
          // Status will be updated by the credential callback
        }
      })
    } catch {
      openOAuth2Popup()
    }
  }, [ensureInitialized, openOAuth2Popup])

  const isDisabled = status !== 'idle'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {status === 'submitting' ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      ) : status === 'loading' ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      ) : (
        <GoogleIcon className="w-5 h-5 flex-shrink-0" />
      )}
      {status === 'submitting'
        ? 'Connexion en cours...'
        : status === 'loading'
          ? 'Chargement...'
          : 'Continuer avec Google'
      }
    </button>
  )
}

// ─── Login Form ─────────────────────────────────────────────────────────

export function LoginForm() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchUser } = useAuthStore()
  const router = useRouter()

  const handleGoogleSuccess = async () => {
    await fetchUser()
    router.push('/')
  }

  const handleGoogleError = (err: string) => {
    setError(err)
  }

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
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-400">ou</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  )
}

// ─── Register Form ──────────────────────────────────────────────────────

interface RegisterFormProps {
  referralCode?: string
}

export function RegisterForm({ referralCode: initialReferralCode }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'acheteur' | 'vendeur'>('acheteur')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchUser } = useAuthStore()
  const router = useRouter()

  const handleGoogleSuccess = async () => {
    await fetchUser()
    router.push('/')
  }

  const handleGoogleError = (err: string) => {
    setError(err)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, userType, referralCode: initialReferralCode }),
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
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-400">ou</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              Vendeur simple : tu peux répondre aux demandes. Pour poster des annonces &quot;Je vends&quot;, prends un abonnement Diambar ou VIP KING.
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
    </div>
  )
}
