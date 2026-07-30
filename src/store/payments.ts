import { create } from 'zustand'
import { apiFetch } from '../utils/api'
import { isDemo } from '../utils/demo'

export interface Payment {
  id: string
  /** Номер документа в ДБО (из выписки) */
  number?: string
  status: 'draft' | 'created' | 'signed' | 'approved' | 'sent' | 'executed' | 'rejected'
  amount: number
  currency: string
  date: Date
  recipient: {
    name: string
    account: string
    bank: string
    bic: string
    inn?: string
    kpp?: string
  }
  payer: {
    name: string
    account: string
  }
  purpose: string
  priority: 'normal' | 'urgent'
  commissionPayment: 'payer' | 'recipient'
  account?: string            // счёт операции (из выписки)
  direction?: 'in' | 'out'
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
  /** Догрузить операцию по id, если список ещё не загружен (deep link). */
  fetchPaymentById: (id: string) => Promise<Payment | undefined>
  /** Черновик, созданный в приложении? Только такие можно менять/подписывать/удалять. */
  isLocalDraft: (id: string) => boolean
  createPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<Payment>
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>
  signPayment: (id: string) => Promise<void>
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
    if (isDemo()) { set({ loading: false, error: null }); return }  // keep in-memory demo payments
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters) {
        if (filters.status) params.append('status', filters.status)
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
        if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())
        if (filters.search) params.append('search', filters.search)
      }

      const data = await apiFetch(`/api/payments?${params}`)
      // API returns { success, data: [] } — handle both shapes
      const list = Array.isArray(data) ? data : (data.data ?? [])
      const parseDate = (d: any) => {
        if (!d) return new Date()
        const s = String(d)
        const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
        if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
        return new Date(d)
      }
      // Статусы ДБО (как в фильтрах веб-интерфейса) → внутренние коды
      const normalizeStatus = (s: string): Payment['status'] => {
        const map: Record<string, Payment['status']> = {
          'ГО': 'executed', 'ИСПОЛНЕН': 'executed', 'ВЫПОЛНЕН': 'executed', 'executed': 'executed',
          'ЧЕРНОВИК': 'draft', 'draft': 'draft',
          'НА ПОДПИСЬ': 'created', 'created': 'created',
          'В ОБРАБОТКЕ': 'sent', 'sent': 'sent',
          'ОТКЛОНЕН': 'rejected', 'ОТКЛОНЁН': 'rejected', 'rejected': 'rejected',
          'signed': 'signed', 'approved': 'approved',
        }
        return map[(s || '').trim().toUpperCase()] ?? map[s] ?? 'executed'
      }
      set({
        payments: list.map((p: any) => ({
          // ID должен быть устойчив между обновлениями списка: на Math.random()
          // ссылка на платёж ломалась после каждой перезагрузки
          id: p.id ?? [p.date, p.number, p.amount].filter(Boolean).join('|'),
          number: p.number ?? undefined,
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
          account: p.account ?? p.payer?.account ?? undefined,
          direction: p.direction ?? (typeof p.amount === 'number' && p.amount >= 0 ? 'in' : 'out'),
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

  // Догрузка одной операции: нужна при открытии ссылки на платёж напрямую
  // (deep link, запуск PWA с домашнего экрана), когда список ещё не загружен.
  fetchPaymentById: async (id: string) => {
    const cached = get().payments.find(p => p.id === id)
    if (cached || isDemo()) return cached

    try {
      const json = await apiFetch(`/api/payments/${encodeURIComponent(id)}`)
      const p = json.data ?? json
      if (!p) return undefined
      await get().fetchPayments()
      return get().payments.find(x => x.id === id)
    } catch {
      // Молча возвращаем undefined: страница сама покажет «не найдено»
      return undefined
    }
  },

  createPayment: async (payment) => {
    if (isDemo()) {
      const now = new Date()
      const newPayment: Payment = {
        ...(payment as Omit<Payment, 'id' | 'createdAt' | 'modifiedAt'>),
        id: 'demo-' + Date.now(),
        status: 'created',
        createdAt: now,
        modifiedAt: now,
      }
      set((state) => ({ payments: [newPayment, ...state.payments] }))
      return newPayment
    }
    try {
      const json = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(payment)
      })
      if (json.error && !json.data) throw new Error(json.error)
      const data = json.data ?? json
      const newPayment: Payment = {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        modifiedAt: data.modifiedAt ? new Date(data.modifiedAt) : new Date(),
      }
      if (json.success === false && json.error) {
        set({ error: 'Черновик сохранён локально. Ошибка отправки в банк: ' + json.error })
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

  // Операции, доступные только для локальных черновиков.
  // Платежи, пришедшие из выписки банка, редактировать/подписывать/удалять
  // нельзя: у них нет идентификатора документа в ДБО — банк отдаёт их
  // только как строки выписки. Раньше эти методы стучались в несуществующие
  // маршруты прокси и падали с «Failed to ...».
  isLocalDraft: (id: string) => {
    const p = get().payments.find(x => x.id === id)
    return !!p && (p.status === 'draft' || id.startsWith('draft-') || id.startsWith('demo-'))
  },

  updatePayment: async (id, updates) => {
    if (!get().isLocalDraft(id)) {
      const message = 'Изменять можно только черновики, созданные в приложении'
      set({ error: message })
      throw new Error(message)
    }
    set((state) => ({
      payments: state.payments.map(p =>
        p.id === id ? { ...p, ...updates, modifiedAt: new Date() } : p
      )
    }))
  },

  signPayment: async (id) => {
    if (isDemo()) {
      set((state) => ({
        payments: state.payments.map(p =>
          p.id === id ? { ...p, status: 'signed' as const, signedAt: new Date(), modifiedAt: new Date() } : p
        )
      }))
      return
    }

    const payment = get().payments.find(p => p.id === id)
    if (!payment) throw new Error('Платёж не найден')
    if (!get().isLocalDraft(id)) {
      const message = 'Подписать можно только черновик, созданный в приложении'
      set({ error: message })
      throw new Error(message)
    }

    // Подпись = повторная отправка документа в банк с sign: true (реальное списание).
    const json = await apiFetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({
        payer: payment.payer,
        recipient: payment.recipient,
        amount: Math.abs(payment.amount),
        purpose: payment.purpose,
        priority: payment.priority,
        sign: true,
      }),
    })
    if (json.success === false) {
      const message = json.error || 'Банк не принял платёж на подпись'
      set({ error: message })
      throw new Error(message)
    }

    set((state) => ({
      payments: state.payments.map(p =>
        p.id === id ? { ...p, status: 'sent' as const, signedAt: new Date(), modifiedAt: new Date() } : p
      )
    }))
  },

  deletePayment: async (id) => {
    if (!isDemo() && !get().isLocalDraft(id)) {
      const message = 'Удалить можно только черновик: операции из выписки банка отзываются в ДБО'
      set({ error: message })
      throw new Error(message)
    }
    set((state) => ({
      payments: state.payments.filter(p => p.id !== id)
    }))
  },

  setFilters: (filters) => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  }
}))
