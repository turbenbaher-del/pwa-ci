import { create } from 'zustand'
import { apiFetch } from '../utils/api'
import { isDemo, demoAccounts } from '../utils/demo'

export interface Account {
  number: string
  currency: string
  balance: number
  status: string
  /** Название счёта в банке: «ГО», «корп.карта», «р/с Ставрополь» */
  name?: string
  /** Откуда взялся остаток: form — из данных банка, header — из шапки страницы */
  balanceSource?: string
}

interface AccountsState {
  accounts: Account[]
  loading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    if (isDemo()) { set({ accounts: demoAccounts, loading: false, error: null }); return }
    set({ loading: true, error: null })
    try {
      const data = await apiFetch('/api/accounts')
      set({ accounts: data.data ?? data, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки', loading: false })
    }
  },
}))
