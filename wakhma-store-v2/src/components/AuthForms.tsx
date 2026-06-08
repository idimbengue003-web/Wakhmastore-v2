'use client'

import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Store, Loader2 } from 'lucide-react'

const GOOGLE_CLIENT_ID = '645891430275-48re5e0v1nagsnei4al8pel4ff9dknq1.apps.googleusercontent.com'

// ─── Shared GIS script loader ───────────────────────────────────────────
// Ensures the Google Identity Services script is loaded exactly once
// across all component instances, and tracks readiness state.

let gisLoadPromise: Promise<void> | null = null

function loadGoogleGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  // Already loaded
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  // Already loading
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if script tag already exists
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      const checkReady = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkReady)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkReady)
        if (window.google?.accounts?.id) {
          resolve()
        } else {
          gisLoadPromise = null
          reject(new Error('GIS load timeout'))
        }
      }, 15_000)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      const checkReady = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkReady)
          resolve()
        }
      }, 50)
      setTimeout(() => {
        clearInterval(checkReady)
        if (window.google?.accounts?.id) resolve()
        else {
          gisLoadPromise = null
          reject(new Error('GIS init timeout'))
        }
      }, 5_000)
    }

    script.onerror = () => {
      gisLoadPromise = null
      reject(new Error('Failed to load GIS script'))
    }

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

// ─── Google Sign-In Button (shared between Login & Register) ────────────
// Uses google.accounts.id.renderButton() for the official Google button
// with a custom fallback button if GIS fails to load.

interface GoogleSignInButtonProps {
  onSuccess: () => void
  onError: (error: string) => void
}

function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [googleReady, setGoogleReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [gisFailed, setGisFailed] = useState(false)
  const callbackRef = useRef(onSuccess)
  const errorRef = useRef(onError)
  const initializedRef = useRef(false)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<Window | null>(null)

  // Keep refs in sync without re-initializing Google
  useEffect(() => {
    callbackRef.current = onSuccess
    errorRef.current = onError
  }, [onSuccess, onError])

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    if (!response.credential) {
      errorRef.current('Réponse Google invalide')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
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
      setSubmitting(false)
    }
  }, [])

  // Initialize Google GIS and render the official button
  const initializeAndRender = useCallback(() => {
    if (!window.google?.accounts?.id) return
    if (initializedRef.current) {
      setGoogleReady(true)
      return
    }

    // Initialize the GIS library
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    })

    initializedRef.current = true

    // Render the official Google button inside our container
    if (buttonContainerRef.current) {
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: buttonContainerRef.current.offsetWidth,
      })
    }

    setGoogleReady(true)
  }, [handleGoogleCredentialResponse])

  // Load the GIS script on mount
  useEffect(() => {
    let cancelled = false

    loadGoogleGisScript()
      .then(() => {
        if (!cancelled) initializeAndRender()
      })
      .catch(() => {
        if (!cancelled) {
          console.warn('GIS script failed to load, using fallback button')
          setGisFailed(true)
        }
      })

    return () => { cancelled = true }
  }, [initializeAndRender])

  // ─── OAuth2 Redirect Flow (popup-based fallback when GIS fails) ────
  const startOAuth2Redirect = useCallback(() => {
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const scope = 'openid email profile'
    const state = crypto.randomUUID()

    sessionStorage.setItem('google_oauth_state', state)

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
      access_type: 'offline',
      prompt: 'select_account',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    popupRef.current = window.open(
      authUrl,
      'google-signin',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'google_oauth_callback') return

      window.removeEventListener('message', handleMessage)

      if (event.data.error) {
        errorRef.current(event.data.error)
        setSubmitting(false)
        return
      }

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: event.data.credential }),
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
        setSubmitting(false)
      }
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setSubmitting(false)
      }
    }, 500)
  }, [])

  // Fallback button click handler (when GIS failed to load)
  const handleFallbackClick = useCallback(() => {
    setSubmitting(true)
    startOAuth2Redirect()
  }, [startOAuth2Redirect])

  return (
    <div className="w-full">
      {/* Official Google rendered button (shown when GIS loads successfully) */}
      {!gisFailed && (
        <div
          ref={buttonContainerRef}
          className="w-full flex justify-center"
          style={{ minHeight: googleReady ? 44 : 44 }}
        >
          {!googleReady && (
            <div className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full bg-white text-gray-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement Google...
            </div>
          )}
        </div>
      )}

      {/* Fallback custom button (shown when GIS fails to load) */}
      {gisFailed && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <GoogleIcon className="w-5 h-5 flex-shrink-0" />
          )}
          {submitting ? 'Connexion...' : 'Continuer avec Google'}
        </button>
      )}
    </div>
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
