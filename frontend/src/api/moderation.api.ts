import { api } from './axios'
import type { Report, AIViolationLog, Notification, CreateReportPayload, ReportStatus, PaginatedResponse } from '@/types'

export const moderationApi = {
  createReport: async (payload: CreateReportPayload) => {
    const res = await api.post<Report>('/moderation/reports/create/', payload)
    return res.data
  },

  listReports: async (status?: ReportStatus, page = 1) => {
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    const res = await api.get<PaginatedResponse<Report>>(`/moderation/reports/?${params}`)
    return res.data
  },

  resolveReport: async (reportId: number, action: 'RESOLVED' | 'DISMISSED') => {
    const res = await api.put(`/moderation/reports/${reportId}/resolve/`, { action })
    return res.data
  },

  adminDeletePost: async (postId: number) => {
    await api.delete(`/moderation/posts/${postId}/delete/`)
  },

  adminSuspendUser: async (userId: number, days: 1 | 7 | 30 | 90) => {
    const res = await api.post(`/moderation/users/${userId}/suspend/`, { days })
    return res.data
  },

  getNotifications: async (page = 1) => {
    const res = await api.get<PaginatedResponse<Notification>>(
      `/moderation/notifications/?page=${page}`
    )
    return res.data
  },

  markNotificationRead: async (notifId: number) => {
    await api.post(`/moderation/notifications/${notifId}/read/`)
  },

  markAllRead: async () => {
    await api.post('/moderation/notifications/read-all/')
  },

  listAiViolations: async (page = 1) => {
    const res = await api.get<PaginatedResponse<AIViolationLog>>(
      `/moderation/ai-violations/?page=${page}`
    )
    return res.data
  },

  markFalsePositive: async (violationId: number) => {
    const res = await api.post(`/moderation/ai-violations/${violationId}/false-positive/`)
    return res.data
  },

  getAdminStats: async () => {
    const res = await api.get<{
      pending_reports: number
      total_users: number
      total_posts: number
      active_violations: number
      suspended_users: number
    }>('/moderation/stats/')
    return res.data
  },
}
