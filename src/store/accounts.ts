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
    // Каждая попытка — отдельный заход прокси в банк (30–90 секунд), и они
    // выполняются по очереди. Поэтому повторяем максимум один раз: раньше
    // четыре попытки растягивали ожидание на минуты и грузили банк.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await apiFetch('/api/accounts')
        const list = data.data ?? data
        if (Array.isArray(list) && list.length > 0) {
          set({ accounts: list, loading: false, error: null })
          return
        }
      } catch (err) {
        if (attempt === 1) {
          set({ error: err instanceof Error ? err.message : 'Ошибка загрузки', loading: false })
          return
        }
      }
      await new Promise(r => setTimeout(r, 2000))
    }
    set({ loading: false, error: 'Банк не вернул счета. Потяните экран вниз, чтобы повторить.' })
  },
}))
