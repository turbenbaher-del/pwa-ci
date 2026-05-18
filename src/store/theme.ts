import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeState {
  isDark: boolean
  fontSize: 'small' | 'normal' | 'large'
  toggleDark: () => void
  setFontSize: (size: 'small' | 'normal' | 'large') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      fontSize: 'normal',

      toggleDark: () => {
        set((state) => ({ isDark: !state.isDark }))
      },

      setFontSize: (size) => {
        set({ fontSize: size })
      }
    }),
    {
      name: 'centrinvest-theme'
    }
  )
)
