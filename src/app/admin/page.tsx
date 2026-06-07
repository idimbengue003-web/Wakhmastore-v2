'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatFCFA, CATEGORY_EMOJIS } from '@/lib/constants'
import { Users, FileText, Eye, Shield, CheckCircle, XCircle, RefreshCw, CreditCard, Clock, MessageCircle, Phone, Search, AlertTriangle, DollarSign } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  phone: string
  role: string
  points: number
  subscriptionTier: string | null
  createdAt: string
  _count: {
    demands: number
    reveals: number
  }
}

interface AdminDemand {
  id: string
  title: string
  description: string
  category: string
  budget: number
  quartier: string
  urgency: string
  status: string
  createdAt: string
  user: {
    name: string
    phone: string
  }
  reveals: unknown[]
}

interface AdminPayment {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  orderReference: string | null
  tierIndex: number | null
  tierId: string | null
  provider: string
  senderPhone: string | null
  senderName: string | null
  transactionId: string | null
  adminNote: string | null
  createdAt: string
  completedAt: string | null
  user: {
    id: string
    name: string
    phone: string
    points: number
    subscriptionTier: string | null
  }
}

interface PaymentStats {
  pending: number
  completed: number
  failed: number
  totalRevenue: number
  whatsappPending: number
}

type AdminTab = 'overview' | 'users' | 'demands' | 'payments'

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [demands, setDemands] = useState<AdminDemand[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ pending: 0, completed: 0, failed: 0, totalRevenue: 0, whatsappPending: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [validating, setValidating] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState<string>('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const loadUsersAndDemands = useCallback(async () => {
    try {
      const [usersRes, demandsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/demands'),
      ])
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
      }
      if (demandsRes.ok) {
        const data = await demandsRes.json()
        setDemands(data.demands)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  const loadPayments = useCallback(async () => {
    try {
      const statusParam = paymentFilter !== 'all' ? `?status=${paymentFilter}` : ''
      const res = await fetch(`/api/admin/payments${statusParam}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
        setPaymentStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    }
  }, [paymentFilter])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([loadUsersAndDemands(), loadPayments()])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [loadUsersAndDemands, loadPayments])

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([loadUsersAndDemands(), loadPayments()])
    setLoading(false)
  }

  const handleDemandStatus = async (demandId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/demands', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, status }),
      })
      if (res.ok) refreshData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handlePaymentAction = async (paymentId: string, action: 'validate' | 'reject', note?: string) => {
    setValidating(paymentId)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action, adminNote: note }),
      })
      const data = await res.json()
      if (res.ok) {
        await loadPayments()
        if (action === 'validate') {
          await loadUsersAndDemands()
        }
      } else {
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setValidating(null)
      setRejectingId(null)
      setRejectNote('')
    }
  }

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        refreshData()
        alert('Base de données initialisée !')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const activeDemands = demands.filter((d) => d.status === 'active')
  const totalUsers = users.length
  const totalReveals = users.reduce((sum, u) => sum + u._count.reveals, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-500" />
            Administration
          </h1>
          <p className="text-gray-500 mt-1">Gérer la plateforme Wakhma Store</p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-indigo-100 text-blue-900 rounded-xl text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['overview', 'users', 'demands', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'overview' && <><Eye className="w-4 h-4" /> Vue d&apos;ensemble</>}
            {tab === 'users' && <><Users className="w-4 h-4" /> Utilisateurs ({totalUsers})</>}
            {tab === 'demands' && <><FileText className="w-4 h-4" /> Annonces ({demands.length})</>}
            {tab === 'payments' && (
              <>
                <CreditCard className="w-4 h-4" /> Paiements
                {paymentStats.whatsappPending > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {paymentStats.whatsappPending}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <OverviewCard
                  icon={<Users className="w-6 h-6 text-blue-800" />}
                  label="Utilisateurs"
                  value={totalUsers.toString()}
                  bgColor="bg-indigo-100"
                />
                <OverviewCard
                  icon={<FileText className="w-6 h-6 text-blue-800" />}
                  label="Annonces actives"
                  value={activeDemands.length.toString()}
                  bgColor="bg-indigo-100"
                />
                <OverviewCard
                  icon={<Eye className="w-6 h-6 text-purple-600" />}
                  label="Révélations"
                  value={totalReveals.toString()}
                  bgColor="bg-purple-100"
                />
                <OverviewCard
                  icon={<CreditCard className="w-6 h-6 text-green-600" />}
                  label="Revenus totaux"
                  value={formatFCFA(paymentStats.totalRevenue)}
                  bgColor="bg-green-100"
                />
                <OverviewCard
                  icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
                  label="Paiements en attente"
                  value={paymentStats.whatsappPending.toString()}
                  bgColor={paymentStats.whatsappPending > 0 ? 'bg-amber-100' : 'bg-gray-100'}
                />
              </div>

              {/* Pending payments alert */}
              {paymentStats.whatsappPending > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">
                        {paymentStats.whatsappPending} paiement(s) WhatsApp en attente de validation
                      </p>
                      <p className="text-xs text-amber-600">Cliquez sur l&apos;onglet Paiements pour les gérer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                  >
                    Voir
                  </button>
                </div>
              )}

              {/* Recent demands */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Dernières annonces</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto custom-scrollbar">
                  {demands.slice(0, 10).map((demand) => (
                    <div key={demand.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {CATEGORY_EMOJIS[demand.category] || '📦'} {demand.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Par {demand.user.name} · {new Date(demand.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        demand.status === 'active' ? 'bg-indigo-100 text-blue-900' :
                        demand.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {demand.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Abonnement</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Annonces</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Révélations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'pro' ? 'bg-indigo-100 text-blue-900' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.points.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-sm">
                          {u.subscriptionTier === 'king' ? '⭐ KING' : u.subscriptionTier === 'diambar' ? '💎 Diambar' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u._count.demands}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u._count.reveals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Demands */}
          {activeTab === 'demands' && (
            <div className="space-y-3">
              {demands.map((demand) => (
                <div key={demand.id} className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{CATEGORY_EMOJIS[demand.category] || '📦'}</span>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{demand.title}</h3>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                          demand.status === 'active' ? 'bg-indigo-100 text-blue-900' :
                          demand.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {demand.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{demand.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>Par {demand.user.name}</span>
                        <span>{demand.quartier}</span>
                        {demand.budget > 0 && <span>{formatFCFA(demand.budget)}</span>}
                        <span>{demand.reveals.length} révélations</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {demand.status !== 'active' && (
                        <button
                          onClick={() => handleDemandStatus(demand.id, 'active')}
                          className="px-3 py-1.5 bg-indigo-100 text-blue-900 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approuver
                        </button>
                      )}
                      {demand.status !== 'rejected' && (
                        <button
                          onClick={() => handleDemandStatus(demand.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ Payments Tab ═══ */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Payment Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{paymentStats.pending}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{paymentStats.completed}</p>
                  <p className="text-xs text-gray-500">Complétés</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{paymentStats.failed}</p>
                  <p className="text-xs text-gray-500">Refusés</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-800">{formatFCFA(paymentStats.totalRevenue)}</p>
                  <p className="text-xs text-gray-500">Revenus totaux</p>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2 items-center">
                <Search className="w-4 h-4 text-gray-400" />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">Tous les paiements</option>
                  <option value="pending">⏳ En attente</option>
                  <option value="completed">✅ Complétés</option>
                  <option value="failed">❌ Refusés</option>
                </select>
                {paymentFilter === 'pending' && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                    {paymentStats.whatsappPending} WhatsApp en attente
                  </span>
                )}
              </div>

              {/* Payments List */}
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun paiement trouvé</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden ${
                        payment.status === 'pending' && payment.provider === 'whatsapp'
                          ? 'border-amber-300'
                          : payment.status === 'pending'
                          ? 'border-yellow-300'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Payment Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* Provider badge */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                payment.provider === 'whatsapp'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {payment.provider === 'whatsapp' ? (
                                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</span>
                                ) : 'Wave'}
                              </span>

                              {/* Status badge */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {payment.status === 'pending' ? '⏳ En attente' :
                                 payment.status === 'completed' ? '✅ Validé' : '❌ Refusé'}
                              </span>

                              {/* Type badge */}
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {payment.type === 'points' ? '💎 Points' : '⭐ Abonnement'}
                              </span>
                            </div>

                            {/* Amount & reference */}
                            <p className="text-lg font-bold text-gray-900">
                              {formatFCFA(payment.amount)}
                              <span className="text-xs text-gray-400 font-normal ml-2">{payment.currency}</span>
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{payment.orderReference}</p>

                            {/* User info */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{payment.user.name}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{payment.user.phone}</span>
                              <span>·</span>
                              <span>{payment.user.points.toLocaleString('fr-FR')} pts</span>
                              {payment.user.subscriptionTier && (
                                <span>{payment.user.subscriptionTier === 'king' ? '⭐' : '💎'}</span>
                              )}
                            </div>

                            {/* WhatsApp proof details */}
                            {payment.provider === 'whatsapp' && (
                              <div className="mt-2 bg-green-50 rounded-lg p-2.5 text-xs space-y-1">
                                {payment.senderPhone && (
                                  <p className="text-green-800">
                                    <span className="font-medium">Expéditeur Wave :</span> {payment.senderPhone}
                                    {payment.senderName && ` (${payment.senderName})`}
                                  </p>
                                )}
                                {payment.transactionId && (
                                  <p className="text-green-800">
                                    <span className="font-medium">ID Transaction :</span>{' '}
                                    <span className="font-mono">{payment.transactionId}</span>
                                  </p>
                                )}
                                <p className="text-green-600">
                                  {new Date(payment.createdAt).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            )}

                            {/* Admin note */}
                            {payment.adminNote && (
                              <p className="mt-2 text-xs text-gray-500 italic">
                                Note admin : {payment.adminNote}
                              </p>
                            )}

                            {/* Tier details */}
                            {payment.type === 'subscription' && payment.tierId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Abonnement : {payment.tierId === 'king' ? '⭐ VIP KING' : '💎 Diambar'}
                              </p>
                            )}
                            {payment.type === 'points' && payment.tierIndex !== null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Pack : {['Découverte', 'Standard', 'Pro', 'VIP Max'][payment.tierIndex] || `#${payment.tierIndex}`}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          {payment.status === 'pending' && (
                            <div className="flex flex-col gap-2 shrink-0 sm:min-w-[140px]">
                              {rejectingId === payment.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                    placeholder="Raison du refus..."
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handlePaymentAction(payment.id, 'reject', rejectNote)}
                                      disabled={validating === payment.id}
                                      className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                                    >
                                      {validating === payment.id ? '...' : 'Confirmer'}
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectNote('') }}
                                      className="px-2 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePaymentAction(payment.id, 'validate')}
                                    disabled={validating === payment.id}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    {validating === payment.id ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4" />
                                        Valider
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setRejectingId(payment.id)}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Refuser
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function OverviewCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
