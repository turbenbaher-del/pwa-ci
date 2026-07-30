import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '../utils/api'

export interface Contractor {
  id: string
  name: string
  account: string
  bank: string
  bic: string
  inn?: string
  email?: string
}

interface ContractorsState {
  contractors: Contractor[]
  syncing: boolean
  /** Причина неудачной синхронизации — раньше ошибка уходила только в консоль */
  syncError: string | null
  lastSynced: number | null
  add: (c: Omit<Contractor, 'id'>) => void
  remove: (id: string) => void
  update: (id: string, updates: Partial<Contractor>) => void
  syncFromBank: () => Promise<void>
}

export const useContractorsStore = create<ContractorsState>()(
  persist(
    (set, get) => ({
      contractors: [],
      syncing: false,
      syncError: null,
      lastSynced: null,

      add: (c) => set((s) => ({ contractors: [...s.contractors, { ...c, id: Date.now().toString() }] })),
      remove: (id) => set((s) => ({ contractors: s.contractors.filter(c => c.id !== id) })),
      update: (id, updates) => set((s) => ({
        contractors: s.contractors.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      syncFromBank: async () => {
        set({ syncing: true, syncError: null })
        try {
          // Два источника из ДБО:
          //  /api/contractors — контрагенты, выведенные из истории операций (есть имена, реквизитов обычно нет)
          //  /api/templates   — справочник «Корреспонденты» банка (есть счёт и БИК)
          // Второй точнее, поэтому его данные имеют приоритет при заполнении реквизитов.
          const [history, directory] = await Promise.all([
            apiFetch('/api/contractors').catch(() => ({ data: [] })),
            apiFetch('/api/templates').catch(() => ({ data: [] })),
          ])

          const incoming: Contractor[] = [
            ...(directory.data ?? []),
            ...(history.data ?? []),
          ]
          if (incoming.length === 0) {
            set({ syncError: 'Банк не вернул контрагентов' })
            return
          }

          // Сопоставляем по счёту, а если его нет — по имени.
          const sameContractor = (a: Contractor, b: Contractor) => {
            const accA = (a.account || '').replace(/\D/g, '')
            const accB = (b.account || '').replace(/\D/g, '')
            if (accA && accB) return accA === accB
            return a.name.trim().toLowerCase() === b.name.trim().toLowerCase()
          }

          const merged = [...get().contractors]
          for (const c of incoming) {
            const idx = merged.findIndex(e => sameContractor(e, c))
            if (idx >= 0) {
              // Правки пользователя не затираем, но пустые поля дозаполняем данными банка
              merged[idx] = {
                ...merged[idx],
                account: merged[idx].account || c.account || '',
                bic:     merged[idx].bic     || c.bic     || '',
                bank:    merged[idx].bank    || c.bank    || '',
                inn:     merged[idx].inn     || c.inn,
              }
            } else {
              merged.push({ ...c, id: c.id || `bank_${(c.account || c.name).replace(/\s/g, '')}` })
            }
          }
          set({ contractors: merged, lastSynced: Date.now() })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Не удалось синхронизировать контрагентов'
          console.error('[contractors] sync failed:', e)
          set({ syncError: message })
        } finally {
          set({ syncing: false })
        }
      },
    }),
    { name: 'centrinvest-contractors' }
  )
)
