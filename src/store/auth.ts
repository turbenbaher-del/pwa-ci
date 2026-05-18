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

      login: async (login: string, password: string, twoFactorCode?: string) => {
        try {
          // Simulate API call - replace with actual API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password, twoFactorCode })
          })

          if (!response.ok) throw new Error('Authentication failed')

          const data = await response.json()
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token
          })
        } catch (error) {
          console.error('Login error:', error)
          throw error
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
