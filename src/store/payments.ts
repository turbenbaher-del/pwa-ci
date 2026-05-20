import { create } from 'zustand'
import { PROXY_URL } from '../utils/api'

export interface Payment {
  id: string
  status: 'draft' | 'created' | 'signed' | 'approved' | 'sent' | 'executed' | 'rejected'
  amount: number
  currency: string
  date: Date
  recipient: {
    name: string
    account: string
    bank: string
    bic: string
  }
  payer: {
    name: string
    account: string
  }
  purpose: string
  priority: 'normal' | 'urgent'
  commissionPayment: 'payer' | 'recipient'
  details: Record<string, any>
  createdAt: Date
  modifiedAt: Date
  signedAt?: Date
  approvedAt?: Date
  sentAt?: Date
  executedAt?: Date
}

export interface PaymentFilters {
  status?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  search?: string
}

export interface PaymentsState {
  payments: Payment[]
  loading: boolean
  error: string | null
  filters: PaymentFilters
  fetchPayments: (filters?: PaymentFilters) => Promise<void>
  getPaymentById: (id: string) => Payment | undefined
  createPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<Payment>
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>
  signPayment: (id: string, signature: string, twoFactorCode?: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  setFilters: (filters: PaymentFilters) => void
  clearError: () => void
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  filters: {},

  fetchPayments: async (filters) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters) {
        if (filters.status) params.append('status', filters.status)
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
        if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())
        if (filters.search) params.append('search', filters.search)
      }

      const response = await fetch(`${PROXY_URL}/api/payments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch payments')

      const data = await response.json()
      // API returns { success, data: [] } — handle both shapes
      const list = Array.isArray(data) ? data : (data.data ?? [])
      const parseDate = (d: any) => {
        if (!d) return new Date()
        const s = String(d)
        const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
        if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
        return new Date(d)
      }
      const normalizeStatus = (s: string): Payment['status'] => {
        const map: Record<string, Payment['status']> = {
          'ГО': 'executed', 'ИСПОЛНЕН': 'executed', 'executed': 'executed',
          'draft': 'draft', 'created': 'created', 'signed': 'signed',
          'approved': 'approved', 'sent': 'sent', 'rejected': 'rejected',
        }
        return map[s] ?? 'executed'
      }
      set({
        payments: list.map((p: any) => ({
          id: p.id ?? p.number ?? String(Math.random()),
          status: normalizeStatus(p.status ?? 'executed'),
          amount: p.amount ?? 0,
          currency: p.currency ?? 'RUR',
          date: parseDate(p.date ?? p.createdAt),
          recipient: typeof p.recipient === 'string'
            ? { name: p.recipient, account: '', bank: '', bic: '' }
            : (p.recipient ?? { name: '', account: '', bank: '', bic: '' }),
          payer: p.payer ?? { name: '', account: '' },
          purpose: p.purpose ?? p.number ?? '',
          priority: p.priority ?? 'normal',
          commissionPayment: p.commissionPayment ?? 'payer',
          details: p.details ?? {},
          createdAt: parseDate(p.createdAt ?? p.date),
          modifiedAt: parseDate(p.modifiedAt ?? p.date ?? p.createdAt),
          signedAt: p.signedAt ? parseDate(p.signedAt) : undefined,
          approvedAt: p.approvedAt ? parseDate(p.approvedAt) : undefined,
        })),
        loading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      })
    }
  },

  getPaymentById: (id: string) => {
    return get().payments.find(p => p.id === id)
  },

  createPayment: async (payment) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      })

      if (!response.ok) throw new Error('Failed to create payment')

      const data = await response.json()
      const newPayment: Payment = {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        modifiedAt: new Date(data.modifiedAt)
      }

      set((state) => ({
        payments: [newPayment, ...state.payments]
      }))

      return newPayment
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      set({ error: message })
      throw error
    }
  },

  updatePayment: async (id, updates) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update payment')

      set((state) => ({
        payments: state.payments.map(p =>
          p.id === id ? { ...p, ...updates, modifiedAt: new Date() } : p
        )
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  },

  signPayment: async (id, signature, twoFactorCode) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/payments/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, twoFactorCode })
      })

      if (!response.ok) throw new Error('Failed to sign payment')

      set((state) => ({
        payments: state.payments.map(p =>
          p.id === id
            ? {
              ...p,
              status: 'signed' as const,
              signedAt: new Date(),
              modifiedAt: new Date()
            }
            : p
        )
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  },

  deletePayment: async (id) => {
    try {
      const response = await fetch(`${PROXY_URL}/api/payments/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete payment')

      set((state) => ({
        payments: state.payments.filter(p => p.id !== id)
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  },

  setFilters: (filters) => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  }
}))
