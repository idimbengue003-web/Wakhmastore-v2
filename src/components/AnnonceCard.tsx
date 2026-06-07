'use client'

import { MapPin, MessageCircle, CheckCircle, Clock } from 'lucide-react'
import { CATEGORY_EMOJIS, formatFCFA } from '@/lib/constants'

interface Annonce {
  id: string
  title: string
  price: number
  budget: number
  image: string
  ville: string
  category: string
  whatsapp: string
  time: string
  annonceType?: string
  userSubscriptionTier?: string | null
  userSalesCount?: number
  userPurchasesCount?: number
}

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const emoji = CATEGORY_EMOJIS[annonce.category] || '📦'
  const isVente = annonce.annonceType === 'vends'
  const contactUrl = `https://wa.me/221${annonce.whatsapp.replace(/\s/g, '')}`

  // Badge based on subscription
  const subscriptionBadge = annonce.userSubscriptionTier === 'king'
    ? '⭐ VIP KING'
    : annonce.userSubscriptionTier === 'diambar'
      ? '💎 Diambar'
      : null

  return (
    <div className="annonce-card bg-white rounded-xl border border-gray-200 overflow-hidden group cursor-pointer">
      {/* Image */}
      <div className="relative h-44 sm:h-48 bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={annonce.image}
          alt={annonce.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-white/95 rounded-md text-[10px] font-semibold text-gray-700 shadow-sm">
            {emoji} {annonce.category}
          </span>
        </div>
        {/* "Je veux vendre" badge */}
        {isVente && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 bg-orange text-white rounded-md text-[10px] font-bold shadow-sm">
              Je veux vendre
            </span>
          </div>
        )}
      </div>

      {/* Subscription + Badges row */}
      {(isVente || subscriptionBadge) && (
        <div className="flex items-center gap-1 px-3 pt-2">
          {subscriptionBadge && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              annonce.userSubscriptionTier === 'king'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-50 text-blue-900'
            }`}>
              {subscriptionBadge}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange">
          {annonce.title}
        </h3>

        {/* Price */}
        <div className="text-orange text-lg font-extrabold tracking-tight">
          {annonce.price > 0 ? formatFCFA(annonce.price) : annonce.budget > 0 ? formatFCFA(annonce.budget) : 'Prix non spécifié'}
        </div>

        {/* Ville + Time */}
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {annonce.ville}
          </div>
          <div className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" /> {annonce.time}
          </div>
        </div>

        {/* Sales/purchases count */}
        {((annonce.userSalesCount ?? 0) > 0 || (annonce.userPurchasesCount ?? 0) > 0) && (
          <div className="flex items-center gap-2 text-[10px]">
            {(annonce.userSalesCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-blue-800">
                <CheckCircle className="w-2.5 h-2.5" /> {annonce.userSalesCount} vente{(annonce.userSalesCount ?? 0) > 1 ? 's' : ''}
              </span>
            )}
            {(annonce.userPurchasesCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-blue-800">
                <CheckCircle className="w-2.5 h-2.5" /> {annonce.userPurchasesCount} achat{(annonce.userPurchasesCount ?? 0) > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Contacter button = WhatsApp */}
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-xs"
        >
          <MessageCircle className="w-4 h-4" />
          Contacter
        </a>
      </div>
    </div>
  )
}
