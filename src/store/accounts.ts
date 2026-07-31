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
  /** Откуда взялся остаток: form/api — из данных банка, unknown — банк не дал */
  balanceSource?: string
  /** Предупреждение банка об арестах: «по 3 счетам в размере всех средств» */
  seizureNotice?: string
  /** Сколько счетов под арестом, если банк указал число */
  seizureAccounts?: number | null
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
    // Первый запрос после простоя банк может отдать «ещё загружается» (503) —
    // список счетов кэшируется на прокси и появляется со второй попытки.
    // Поэтому повторяем несколько раз, а не сдаёмся с пустым списком.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const data = await apiFetch('/api/accounts')
        const list = data.data ?? data
        if (Array.isArray(list) && list.length > 0) {
          set({ accounts: list, loading: false, error: null })
          return
        }
      } catch (err) {
        // последняя попытка — покажем ошибку, иначе тихо повторим
        if (attempt === 3) {
          set({ error: err instanceof Error ? err.message : 'Ошибка загрузки', loading: false })
          return
        }
      }
      await new Promise(r => setTimeout(r, 2500))
    }
    set({ loading: false })
  },
}))
