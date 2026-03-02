import { api, buildFormData } from './axios'
import type { Community, CommunityList, CreateCommunityPayload, UpdateCommunityPayload, UserPublic, PaginatedResponse } from '@/types'

export const communitiesApi = {
  list: async (page = 1) => {
    const res = await api.get<PaginatedResponse<CommunityList>>(`/communities/?page=${page}`)
    return res.data
  },

  getMine: async () => {
    const res = await api.get<PaginatedResponse<CommunityList>>('/communities/me/')
    return res.data
  },

  getDetail: async (id: number) => {
    const res = await api.get<Community>(`/communities/${id}/`)
    return res.data
  },

  create: async (payload: CreateCommunityPayload) => {
    const form = buildFormData(payload as unknown as Record<string, unknown>)
    const res = await api.post<Community>('/communities/create/', form)
    return res.data
  },

  update: async (id: number, payload: UpdateCommunityPayload) => {
    const form = buildFormData(payload as unknown as Record<string, unknown>)
    const res = await api.patch<Community>(`/communities/${id}/update/`, form)
    return res.data
  },

  toggleJoin: async (communityId: number) => {
    const res = await api.post<{ joined: boolean }>('/communities/join/', { community_id: communityId })
    return res.data
  },

  getMembers: async (id: number, page = 1) => {
    const res = await api.get<PaginatedResponse<UserPublic>>(
      `/communities/${id}/members/?page=${page}`
    )
    return res.data
  },

  addModerator: async (communityId: number, userId: number) => {
    const res = await api.post(`/communities/${communityId}/moderators/add/`, { user_id: userId })
    return res.data
  },

  removeModerator: async (communityId: number, userId: number) => {
    await api.delete(`/communities/${communityId}/moderators/${userId}/remove/`)
  },
}
