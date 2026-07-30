import { create } from 'zustand'

// Единый контракт подтверждения/подписи (перенос из Т: requestConfirmation → sign).
// Любая операция вызывает confirm(...) и получает Promise<{ ok, code? }>.
export interface ConfirmOptions {
  title: string
  message?: string
  /** строки-детали операции (получатель/сумма и т.п.) */
  details?: { label: string; value: string }[]
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** true → двухфазная подпись с кодом (как sign у Т); false → простое да/нет */
  requireCode?: boolean
}

export interface ConfirmResult {
  ok: boolean
  code?: string
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions | null
  _resolve: ((r: ConfirmResult) => void) | null
  confirm: (o: ConfirmOptions) => Promise<ConfirmResult>
  _finish: (r: ConfirmResult) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  _resolve: null,

  confirm: (o) =>
    new Promise<ConfirmResult>((resolve) => {
      set({ open: true, options: o, _resolve: resolve })
    }),

  _finish: (r) => {
    const res = get()._resolve
    set({ open: false, options: null, _resolve: null })
    res?.(r)
  },
}))

/** Удобная обёртка для вызова из компонентов/сторов. */
export const confirm = (o: ConfirmOptions) => useConfirmStore.getState().confirm(o)
