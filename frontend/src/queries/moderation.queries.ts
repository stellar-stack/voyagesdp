import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { moderationApi } from '@/api'
import { useNotificationStore } from '@/store/notification.store'
import { QUERY_KEYS } from './queryClient'
import type { CreateReportPayload, ReportStatus } from '@/types'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: moderationApi.getAdminStats,
    staleTime: 1000 * 60,
  })
}

export function useAdminDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => moderationApi.adminDeletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminSuspendUser() {
  return useMutation({
    mutationFn: ({ userId, days }: { userId: number; days: 1 | 7 | 30 | 90 }) =>
      moderationApi.adminSuspendUser(userId, days),
  })
}

export function useNotificationsQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: ({ pageParam = 1 }) => moderationApi.getNotifications(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notifId: number) => moderationApi.markNotificationRead(notifId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const { markAllReadLocally } = useNotificationStore()
  return useMutation({
    mutationFn: moderationApi.markAllRead,
    onSuccess: () => {
      markAllReadLocally()
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
    },
  })
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => moderationApi.createReport(payload),
  })
}

export function useReportsQuery(status?: ReportStatus) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.REPORTS(status),
    queryFn: ({ pageParam = 1 }) => moderationApi.listReports(status, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useResolveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: number; action: 'RESOLVED' | 'DISMISSED' }) =>
      moderationApi.resolveReport(reportId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS() })
    },
  })
}

export function useAiViolationsQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.AI_VIOLATIONS,
    queryFn: ({ pageParam = 1 }) => moderationApi.listAiViolations(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useMarkFalsePositive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (violationId: number) => moderationApi.markFalsePositive(violationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.AI_VIOLATIONS })
    },
  })
}
