import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  add: (c: Omit<Contractor, 'id'>) => void
  remove: (id: string) => void
  update: (id: string, updates: Partial<Contractor>) => void
}

export const useContractorsStore = create<ContractorsState>()(
  persist(
    (set) => ({
      contractors: [
        { id: '1', name: 'ООО Поставщик', account: '40702810500000000001', bank: 'Сбербанк', bic: '044525999', inn: '7743013419', email: 'info@supplier.ru' },
        { id: '2', name: 'ИП Клиентов А.В.', account: '40802810500000000002', bank: 'Альфа-Банк', bic: '044585100', inn: '616500000000', email: 'client@example.ru' },
      ],
      add: (c) => set((s) => ({ contractors: [...s.contractors, { ...c, id: Date.now().toString() }] })),
      remove: (id) => set((s) => ({ contractors: s.contractors.filter(c => c.id !== id) })),
      update: (id, updates) => set((s) => ({ contractors: s.contractors.map(c => c.id === id ? { ...c, ...updates } : c) })),
    }),
    { name: 'centrinvest-contractors' }
  )
)
