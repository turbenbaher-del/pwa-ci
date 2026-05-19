import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PROXY_URL } from '../utils/api'

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
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (login: string, password: string) => {
        const res = await fetch(`${PROXY_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Неверные учетные данные')
        }

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

      logout: () => {
        fetch(`${PROXY_URL}/api/logout`, { method: 'POST' }).catch(() => {})
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
