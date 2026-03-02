import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '@/api'
import { QUERY_KEYS } from './queryClient'
import type { CreateCommunityPayload, UpdateCommunityPayload } from '@/types'

export function useCommunitiesQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.COMMUNITIES,
    queryFn: ({ pageParam = 1 }) => communitiesApi.list(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useMyCommunities() {
  return useQuery({
    queryKey: QUERY_KEYS.MY_COMMUNITIES,
    queryFn: communitiesApi.getMine,
  })
}

export function useCommunityDetail(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.COMMUNITY(id),
    queryFn: () => communitiesApi.getDetail(id),
    enabled: !!id,
  })
}

export function useCommunityMembers(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.COMMUNITY_MEMBERS(id),
    queryFn: () => communitiesApi.getMembers(id),
    enabled: !!id,
  })
}

export function useCreateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommunityPayload) => communitiesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITIES })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_COMMUNITIES })
    },
  })
}

export function useUpdateCommunity(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCommunityPayload) => communitiesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITY(id) })
    },
  })
}

export function useToggleJoin(communityId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => communitiesApi.toggleJoin(communityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITY(communityId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITIES })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_COMMUNITIES })
    },
  })
}
