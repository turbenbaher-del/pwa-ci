import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  login: (login: string, password: string, twoFactorCode?: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (login: string, password: string) => {
        // Mock authentication - replace with actual API
        if (login === '24cmvKy8' && password === 'dbocib14Z') {
          const user: User = {
            id: '1',
            login: '24cmvKy8',
            name: 'Тестовый пользователь',
            email: 'test@centrinvest.ru',
            phone: '+7 (999) 999-99-99',
            role: 'user',
            permissions: ['payments.view', 'payments.create', 'payments.sign'],
            lastLogin: new Date()
          }
          set({
            isAuthenticated: true,
            user,
            token: 'mock-token-' + Date.now()
          })
        } else {
          throw new Error('Неверные учетные данные')
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null
        })
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }))
      },

      checkAuth: async () => {
        const state = get()
        if (!state.token) return false

        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${state.token}`
            }
          })
          return response.ok
        } catch {
          return false
        }
      }
    }),
    {
      name: 'centrinvest-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token
      })
    }
  )
)
