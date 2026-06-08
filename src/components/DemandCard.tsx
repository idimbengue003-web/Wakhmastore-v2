'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_EMOJIS, formatFCFA, timeAgo } from '@/lib/constants'
import { MapPin, Clock, MessageCircle, CheckCircle, Eye } from 'lucide-react'

interface DemandCardProps {
  demand: {
    id: string
    title: string
    description: string
    category: string
    budget: number
    price: number
    quartier: string
    urgency: string
    photo?: string | null
    whatsapp: string
    whatsappRevealed: boolean
    status: string
    annonceType?: string
    expiresAt?: string | null
    createdAt: string
    userName: string
    userSubscriptionTier?: string | null
    userType?: string
    userSalesCount?: number
    userPurchasesCount?: number
    hasPhoneInText: boolean
  }
  onReveal?: (demandId: string) => void
}

const URGENCY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: '🔥 Urgent' },
  '2jours': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ 2 jours' },
  '1semaine': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '📅 1 semaine' },
  flexible: { bg: 'bg-indigo-100', text: 'text-blue-900', label: '😊 Flexible' },
}

export function DemandCard({ demand }: DemandCardProps) {
  const isVente = demand.annonceType === 'vends'
  const isSold = demand.status === 'sold'
  const isExpired = demand.status === 'expired'
  const urgencyStyle = URGENCY_STYLES[demand.urgency] || URGENCY_STYLES.flexible
  const emoji = CATEGORY_EMOJIS[demand.category] || '📦'

  // Badge based on subscription
  const subscriptionBadge = demand.userSubscriptionTier === 'king'
    ? '⭐ VIP KING'
    : demand.userSubscriptionTier === 'diambar'
      ? '💎 Diambar'
      : null

  return (
    <Link href={`/annonces/${demand.id}`} className="block">
      <div className={`annonce-card bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${
        isSold ? 'border-blue-200 opacity-70' : isExpired ? 'border-amber-200 opacity-60' : 'border-gray-200'
      }`}>
        {/* Photo or emoji header */}
        {demand.photo ? (
          <div className="h-36 bg-gray-100 relative overflow-hidden">
            {demand.photo.startsWith('data:') ? (
              <img src={demand.photo} alt={demand.title} className="w-full h-full object-cover" />
            ) : (
              <Image src={demand.photo} alt={demand.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded-md text-[10px] font-semibold text-gray-700">
              {emoji} {demand.category}
            </span>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center relative bg-orange-bg">
            <span className="text-4xl">{emoji}</span>
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded-md text-[10px] font-semibold text-gray-700">
              {demand.category}
            </span>
          </div>
        )}

        {/* Status badges */}
        {(isVente || isSold || isExpired) && (
          <div className="flex items-center gap-1 px-3 pt-2 flex-wrap">
            {isSold && (
              <span className="px-2 py-0.5 bg-indigo-100 text-blue-900 rounded-md text-[10px] font-bold">
                ✓ Vendu
              </span>
            )}
            {isExpired && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold">
                Expirée
              </span>
            )}
            {isVente && !isSold && (
              <span className="px-2 py-0.5 bg-orange text-white rounded-md text-[10px] font-bold">
                Je veux vendre
              </span>
            )}
            {subscriptionBadge && !isSold && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                demand.userSubscriptionTier === 'king'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-50 text-blue-900'
              }`}>
                {subscriptionBadge}
              </span>
            )}
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Title & Urgency */}
          <div className="flex items-start justify-between gap-1">
            <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${isSold ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {demand.title}
            </h3>
            {!isVente && demand.urgency !== 'flexible' && !isSold && (
              <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                {urgencyStyle.label}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2">{demand.description}</p>

          {/* Price (vends) or Budget (cherche) */}
          {isVente && demand.price > 0 ? (
            <div className="text-orange text-lg font-extrabold tracking-tight">
              {formatFCFA(demand.price)}
            </div>
          ) : demand.budget > 0 ? (
            <div className="text-orange text-lg font-extrabold tracking-tight">
              {formatFCFA(demand.budget)}
            </div>
          ) : null}

          {/* Location & Time */}
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {demand.quartier}
            </div>
            <div className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {timeAgo(new Date(demand.createdAt))}
            </div>
          </div>

          {/* User info with sales/purchases count */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Par {demand.userName}</span>
            {demand.userSubscriptionTier === 'king' && <span>⭐</span>}
            {demand.userSubscriptionTier === 'diambar' && <span>💎</span>}
            {((demand.userSalesCount ?? 0) > 0 || (demand.userPurchasesCount ?? 0) > 0) && (
              <span className="text-gray-300">•</span>
            )}
            {(demand.userSalesCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-blue-800">
                <CheckCircle className="w-2.5 h-2.5" /> {demand.userSalesCount} vente{(demand.userSalesCount ?? 0) > 1 ? 's' : ''}
              </span>
            )}
            {(demand.userPurchasesCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-blue-800">
                <CheckCircle className="w-2.5 h-2.5" /> {demand.userPurchasesCount} achat{(demand.userPurchasesCount ?? 0) > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* CTA button - now navigates to detail page */}
          {!isSold && !isExpired && (
            demand.whatsappRevealed ? (
              <div className="w-full flex items-center justify-center gap-1.5 mt-1 px-3 py-2 bg-blue-800 text-white rounded-lg font-bold text-xs">
                <MessageCircle className="w-3.5 h-3.5" /> Voir l&apos;annonce
              </div>
            ) : (
              <div className="w-full flex items-center justify-center gap-1.5 mt-1 px-3 py-2 bg-orange hover:bg-orange-dark text-white rounded-lg font-bold text-xs transition-colors">
                <Eye className="w-3.5 h-3.5" /> Voir les détails
              </div>
            )
          )}
        </div>
      </div>
    </Link>
  )
}
