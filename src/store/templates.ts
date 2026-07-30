import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Шаблоны повторяющихся платежей: получатель + назначение + сумма в один тап.
//
// Хранятся локально осознанно: в ДБО Центр-инвеста аналога нет — банковский
// справочник «Корреспонденты» (эндпоинт /api/templates) содержит только реквизиты
// получателей, без назначения, суммы и приоритета. Реквизиты из банка подтягиваются
// в справочник контрагентов (см. store/contractors.ts), а назначение и сумму
// пользователь задаёт здесь.
export interface PaymentTemplate {
  id: string
  name: string
  recipientName: string
  recipientAccount: string
  recipientBank: string
  recipientBic: string
  purpose: string
  amount?: string            // optional preset amount
  currency: string
  priority: 'normal' | 'urgent'
  commissionPayment: 'payer' | 'recipient'
  createdAt: number
  usageCount: number
}

export type TemplateDraft = Omit<PaymentTemplate, 'id' | 'createdAt' | 'usageCount'>

interface TemplatesState {
  templates: PaymentTemplate[]
  addTemplate: (t: TemplateDraft) => PaymentTemplate
  removeTemplate: (id: string) => void
  touchTemplate: (id: string) => void          // bump usage on apply
}

const uid = () =>
  'tpl_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set) => ({
      templates: [],

      addTemplate: (t) => {
        const tpl: PaymentTemplate = {
          ...t,
          id: uid(),
          createdAt: Date.now(),
          usageCount: 0,
        }
        set((s) => ({ templates: [tpl, ...s.templates] }))
        return tpl
      },

      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((x) => x.id !== id) })),

      touchTemplate: (id) =>
        set((s) => ({
          templates: s.templates
            .map((x) => (x.id === id ? { ...x, usageCount: x.usageCount + 1 } : x))
            .sort((a, b) => b.usageCount - a.usageCount),
        })),
    }),
    { name: 'centrinvest-payment-templates' }
  )
)
