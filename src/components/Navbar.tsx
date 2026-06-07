'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Menu, X, Store, LogOut, User, Zap } from 'lucide-react'
import { useState, useCallback } from 'react'

export function Navbar() {
  const { user } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-orange">Wakhma Store</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 ml-6">
            <Link href="/annonces" className="text-sm font-medium text-gray-700 hover:text-orange">
              Catégories
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/deposer"
              className="px-4 py-2 bg-orange hover:bg-orange-dark text-white rounded-lg font-bold text-sm"
            >
              Déposer une annonce
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 bg-orange-bg rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-orange" />
                  </div>
                  <span className="hidden lg:inline max-w-[80px] truncate text-xs">{user.name}</span>
                  {user.subscriptionTier === 'king' && <span className="text-xs">⭐</span>}
                  {user.subscriptionTier === 'diambar' && <span className="text-xs">💎</span>}
                </button>
                {/* Invisible bridge to keep dropdown open when moving mouse */}
                <div className="absolute right-0 top-full h-2 w-full" />
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{user.userType === 'vendeur' ? 'Vendeur' : 'Acheteur'}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-orange font-medium">
                      <Zap className="w-3 h-3" /> {user.points.toLocaleString('fr-FR')} pts
                    </div>
                  </div>
                  <Link href="/profil" className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    Mon profil
                  </Link>
                  <Link href="/annonces" className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    Annonces
                  </Link>
                  <Link href="/recharge" className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    Recharger
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3 h-3" /> Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-orange hover:text-orange-dark border border-orange/30 hover:border-orange/50 rounded-lg"
              >
                Se connecter
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="px-4 py-2 space-y-0.5">
            <Link href="/annonces" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:text-orange hover:bg-orange-bg rounded-lg">
              Catégories
            </Link>
            <Link href="/deposer" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:text-orange hover:bg-orange-bg rounded-lg">
              Déposer une annonce
            </Link>
            {user ? (
              <>
                <Link href="/profil" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Mon profil
                </Link>
                <Link href="/recharge" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Recharger
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold text-orange">Se connecter</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
