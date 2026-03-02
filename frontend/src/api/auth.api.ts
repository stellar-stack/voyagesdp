import { api, buildFormData } from './axios'
import type { UserPrivate, UserPublic, PaginatedResponse, LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/types'

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await api.post<{ success: boolean }>('/auth/token/', payload)
    return res.data
  },

  register: async (payload: RegisterPayload) => {
    const form = buildFormData(payload as unknown as Record<string, unknown>)
    const res = await api.post<{ success: boolean; message: string }>('/auth/register/', form)
    return res.data
  },

  refreshToken: async () => {
    const res = await api.post<{ refreshed: boolean }>('/auth/token/refresh/')
    return res.data
  },

  verifyEmail: async (token: string) => {
    const res = await api.get<{ verified: boolean }>(`/auth/verify-email/?token=${token}`)
    return res.data
  },

  logout: async () => {
    const res = await api.post<{ success: boolean }>('/auth/logout/')
    return res.data
  },

  getMe: async () => {
    const res = await api.get<UserPrivate>('/auth/users/me/')
    return res.data
  },

  updateMe: async (payload: UpdateProfilePayload) => {
    const form = buildFormData(payload as unknown as Record<string, unknown>)
    const res = await api.patch<UserPrivate>('/auth/users/me/update/', form)
    return res.data
  },

  getProfile: async (username: string) => {
    const res = await api.get<UserPublic | UserPrivate>(`/auth/users/${username}/`)
    return res.data
  },

  toggleFollow: async (username: string) => {
    const res = await api.post<{ following: boolean }>('/auth/users/follow/', { username })
    return res.data
  },

  getFollowers: async (username: string, page = 1) => {
    const res = await api.get<PaginatedResponse<UserPublic>>(
      `/auth/users/${username}/followers/?page=${page}`
    )
    return res.data
  },

  getFollowing: async (username: string, page = 1) => {
    const res = await api.get<PaginatedResponse<UserPublic>>(
      `/auth/users/${username}/following/?page=${page}`
    )
    return res.data
  },

  searchUsers: async (q: string) => {
    const res = await api.get<UserPublic[]>(`/auth/users/search/?q=${encodeURIComponent(q)}`)
    return res.data
  },

  // OAuth
  googleOAuth: async (credential: string) => {
    const res = await api.post<{ success: boolean }>('/auth/social/google/', { credential })
    return res.data
  },

  githubOAuth: async (code: string) => {
    const res = await api.post<{ success: boolean }>('/auth/social/github/', { code })
    return res.data
  },

  // Admin
  listAllUsers: async (page = 1, q = '') => {
    const params = new URLSearchParams({ page: String(page) })
    if (q) params.set('q', q)
    const res = await api.get<import('@/types').PaginatedResponse<import('@/types').UserAdmin>>(
      `/auth/admin/users/?${params}`
    )
    return res.data
  },

  suspendUser: async (userId: number, days: 1 | 7 | 30 | 90) => {
    const res = await api.post(`/auth/admin/users/${userId}/suspend/`, { days })
    return res.data
  },

  clearViolations: async (userId: number) => {
    const res = await api.post(`/auth/admin/users/${userId}/violations/clear/`)
    return res.data
  },

  promoteUser: async (userId: number, role: 'USER' | 'MODERATOR') => {
    const res = await api.post(`/auth/admin/users/${userId}/promote/`, { role })
    return res.data
  },
}
