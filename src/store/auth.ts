import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '../utils/api'
import { setDemo, isDemo, demoContractors } from '../utils/demo'
import { useContractorsStore } from './contractors'

export interface User {
  id: string
  login: string
  name: string
  email?: string
  phone?: string
  role: 'user' | 'admin' | 'accountant'
  permissions: string[]
  lastLogin: Date
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (login: string, password: string) => Promise<void>
  loginDemo: () => void
  logout: () => void
  /** Локальный сброс без обращения к серверу — когда сессии там уже нет. */
  clearSession: () => void
  /** Демо-личность не осталась поверх настоящих данных банка? */
  isSessionConsistent: () => boolean
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (login: string, password: string) => {
        // Демо-режим выключаем ТОЛЬКО после успешного входа. Раньше это делалось
        // до запроса, и при неудаче приложение оставалось «авторизованным» под
        // прежним демо-пользователем, но уже тянуло настоящие данные банка —
        // на экране была демо-подпись поверх реальных счетов.
        const data = await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ login, password }),
        })
        if (!data.success) {
          throw new Error(data.error || 'Неверные учетные данные')
        }
        setDemo(false)

        const user: User = {
          id: '1',
          login,
          name: data.name || login,
          role: 'user',
          permissions: ['payments.view', 'payments.create', 'payments.sign'],
          lastLogin: new Date(),
        }
        set({ isAuthenticated: true, user, token: 'proxy-token-' + Date.now() })
      },

      loginDemo: () => {
        setDemo(true)
        const user: User = {
          id: 'demo',
          login: 'demo',
          name: 'Демо-компания ООО',
          role: 'user',
          permissions: ['payments.view', 'payments.create', 'payments.sign'],
          lastLogin: new Date(),
        }
        // seed demo contractors so the payment form's picker works
        useContractorsStore.setState({ contractors: demoContractors })
        set({ isAuthenticated: true, user, token: 'demo-token' })
      },

      // Сессия целостна? Демо-личность не должна оставаться поверх настоящих
      // данных банка: так на экране был «Демо-компания ООО» с живыми счетами.
      isSessionConsistent: () => {
        const state = get()
        if (!state.isAuthenticated || !state.user) return true
        return (state.user.id === 'demo') === isDemo()
      },

      logout: () => {
        setDemo(false)
        apiFetch('/api/logout', { method: 'POST' }).catch(() => {})
        set({ isAuthenticated: false, user: null, token: null })
      },

      // Сервер сообщил, что сессии у него нет. Звать /api/logout в этом случае
      // НЕЛЬЗЯ: он стирает учётные данные и закрывает браузер — а вход мог
      // как раз идти фоном, и мы бы убили его на полпути. Именно так
      // приложение разлогинивало само себя в ту же секунду после входа.
      clearSession: () => {
        setDemo(false)
        set({ isAuthenticated: false, user: null, token: null })
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },
    }),
    {
      name: 'centrinvest-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
)
