import { create } from 'zustand'
import { apiFetch } from '../utils/api'

export interface Account {
  number: string
  currency: string
  balance: number
  status: string
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
    set({ loading: true, error: null })
    try {
      const data = await apiFetch('/api/accounts')
      set({ accounts: data.data ?? data, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки', loading: false })
    }
  },
}))
