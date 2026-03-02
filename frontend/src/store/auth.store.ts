import { create } from 'zustand'
import type { UserPrivate } from '@/types'

interface AuthState {
  user: UserPrivate | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: UserPrivate | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearUser: () => set({ user: null }),
}))
