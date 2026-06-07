export const REVEAL_PRICES: Record<string, number> = {
  user: 1000,
  pro: 1000,
  king: 500,
  admin: 0,
}

export const VENDOR_ANNONCE_LIMITS: Record<string, number> = {
  none: 0,       // vendeur simple = 0 annonces
  diambar: 3,    // Diambar = 3 annonces
  king: 3,       // VIP KING = 3 annonces
}

export const SUBSCRIPTION_TIERS = [
  {
    id: 'diambar',
    name: 'Diambar',
    price: 5000,
    durationDays: 30,
    revealPrice: 1000,
    bonusPoints: 30000,
    badge: '💎',
    features: [
      'Révélation à 1 000 pts',
      '30 000 points offerts',
      'Badge 💎 Diambar',
      '3 annonces "Je vends" actives',
      'Annonces visibles en priorité',
    ],
  },
  {
    id: 'king',
    name: 'VIP KING',
    price: 10000,
    durationDays: 30,
    revealPrice: 500,
    bonusPoints: 75000,
    badge: '⭐',
    features: [
      'Révélation à 500 pts (meilleur prix !)',
      '75 000 points offerts',
      'Badge ⭐ VIP KING',
      '3 annonces "Je vends" actives',
      'Nom en étoile dans les messages WhatsApp',
    ],
  },
]

export const POINTS_TIERS = [
  { prix: 1000, points: 8000, label: 'Découverte' },
  { prix: 2000, points: 17000, label: 'Standard' },
  { prix: 5000, points: 50000, label: 'Pro' },
  { prix: 10000, points: 105000, label: 'VIP Max' },
]

export const CATEGORIES = [
  'Téléphones', 'TV & Écrans', 'Frigo & Congélateur', 'Climatiseur & Ventilateur',
  'Ordinateurs', 'Tablettes', 'Audio & Son', 'Électroménager', 'Plomberie',
  'Électricité', 'Meubles', 'Mode & Vetements', 'Cosmétiques', 'Alimentation',
  'Services', 'Transport', 'Immobilier', 'Autre',
]

export const QUARTIERS = [
  'Médina', 'Plateau', 'Almadies', 'Dakar-Plateau', 'Fann', 'Point E',
  'Mermoz', 'Sacre-Coeur', 'Ouakam', 'Ngor', 'Yoff', 'Parcelles Assainies',
  'Grand Yoff', 'Hann', 'Bel Air', 'Colobane', 'Gueule Tapée', 'Fass',
  'Dieuppeul', 'Sicap Liberte', "Patte d'Oie", 'Cambérène', 'Ndiarème',
  'Grand Dakar', 'Biscuiterie', 'HLM', 'Sahm', 'Thiaroye', 'Keur Massar',
]

export const URGENCY_OPTIONS = [
  { value: 'urgent', label: '🔥 Urgent', desc: "J'en ai besoin tout de suite" },
  { value: '2jours', label: '⏳ Dans 2 jours', desc: "J'en ai besoin sous 2 jours" },
  { value: '1semaine', label: '📅 Dans 1 semaine', desc: "J'en ai besoin sous 1 semaine" },
  { value: 'flexible', label: '😊 Flexible', desc: 'Pas de pressing' },
]

export function getRevealPrice(role: string, subscriptionTier?: string | null): number {
  if (subscriptionTier === 'king') return REVEAL_PRICES.king
  return REVEAL_PRICES.user
}

export function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const PHONE_REGEX = /(\+221\s*)?7[0-9](\s?\d){7}/g

export function containsPhoneInText(text: string): boolean {
  if (!text) return false
  PHONE_REGEX.lastIndex = 0
  return PHONE_REGEX.test(text)
}

export function maskPhonesInText(text: string): string {
  if (!text) return text
  return text.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, '')
    const sn = digits.slice(-8)
    if (sn.length >= 8) {
      return sn.slice(0, 2) + ' ─── ── ' + sn.slice(-2)
    }
    return '███ ─── ── ██'
  })
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone || ''
  return phone.slice(0, 2) + ' *** ** ' + phone.slice(-2)
}

export function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
}

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Téléphones': '📱',
  'TV & Écrans': '📺',
  'Frigo & Congélateur': '🧊',
  'Climatiseur & Ventilateur': '❄️',
  'Ordinateurs': '💻',
  'Tablettes': '📲',
  'Audio & Son': '🔊',
  'Électroménager': '🏠',
  'Plomberie': '🔧',
  'Électricité': '⚡',
  'Meubles': '🛋️',
  'Mode & Vetements': '👗',
  'Cosmétiques': '💄',
  'Alimentation': '🍜',
  'Services': '🤝',
  'Transport': '🚗',
  'Immobilier': '🏗️',
  'Autre': '📦',
}
