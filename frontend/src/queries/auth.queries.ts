import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from './queryClient'
import type { LoginPayload, RegisterPayload, UpdateProfilePayload, UserPublic } from '@/types'

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: QUERY_KEYS.USER(username),
    queryFn: () => authApi.getProfile(username),
    enabled: !!username,
  })
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FOLLOWERS(username),
    queryFn: () => authApi.getFollowers(username),
    enabled: !!username,
  })
}

export function useFollowing(username: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FOLLOWING(username),
    queryFn: () => authApi.getFollowing(username),
    enabled: !!username,
  })
}

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH(q),
    queryFn: () => authApi.searchUsers(q),
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async () => {
      // Cancel any stale ME fetch (e.g. triggered by logout's qc.clear())
      // so it can't overwrite fresh data with a 401 after we set it here
      await qc.cancelQueries({ queryKey: QUERY_KEYS.ME })
      const user = await authApi.getMe()
      setUser(user)
      qc.setQueryData(QUERY_KEYS.ME, user)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  const { clearUser } = useAuthStore()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      // Cancel all inflight requests before clearing so no stale
      // 401 response can land in the cache after a subsequent login
      await qc.cancelQueries()
      clearUser()
      qc.clear()
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateMe(payload),
    onSuccess: (user) => {
      setUser(user)
      qc.setQueryData(QUERY_KEYS.ME, user)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USER(user.username) })
    },
  })
}

export function useToggleFollow(username: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.toggleFollow(username),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.USER(username) })
      const prev = qc.getQueryData<UserPublic>(QUERY_KEYS.USER(username))
      if (prev) {
        qc.setQueryData<UserPublic>(QUERY_KEYS.USER(username), {
          ...prev,
          is_following: !prev.is_following,
          followers_count: prev.is_following
            ? prev.followers_count - 1
            : prev.followers_count + 1,
        })
      }
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(QUERY_KEYS.USER(username), context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USER(username) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ME })
    },
  })
}
