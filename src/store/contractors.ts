import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PROXY_URL } from '../utils/api'

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
      lastSynced: null,

      add: (c) => set((s) => ({ contractors: [...s.contractors, { ...c, id: Date.now().toString() }] })),
      remove: (id) => set((s) => ({ contractors: s.contractors.filter(c => c.id !== id) })),
      update: (id, updates) => set((s) => ({
        contractors: s.contractors.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      syncFromBank: async () => {
        set({ syncing: true })
        try {
          const res = await fetch(`${PROXY_URL}/api/contractors`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          const incoming: Contractor[] = json.data ?? []
          if (incoming.length === 0) return

          // Merge: keep manually-added contractors, update/add bank ones
          const existing = get().contractors
          const merged = [...existing]
          for (const c of incoming) {
            const idx = merged.findIndex(e => e.name === c.name || e.id === c.id)
            if (idx >= 0) {
              // Update with bank data but preserve user edits
              merged[idx] = {
                ...merged[idx],
                account: merged[idx].account || c.account,
                bic:     merged[idx].bic     || c.bic,
                bank:    merged[idx].bank    || c.bank,
                inn:     merged[idx].inn     || c.inn,
              }
            } else {
              merged.push({ ...c, id: c.id || Date.now().toString() + Math.random() })
            }
          }
          set({ contractors: merged, lastSynced: Date.now() })
        } catch (e) {
          console.error('[contractors] sync failed:', e)
        } finally {
          set({ syncing: false })
        }
      },
    }),
    { name: 'centrinvest-contractors' }
  )
)
