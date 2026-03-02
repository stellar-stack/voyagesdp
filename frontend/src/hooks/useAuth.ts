import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/queries/queryClient'

export function useAuth() {
  const { user, isLoading, isInitialized, setUser, setLoading, setInitialized } = useAuthStore()

  const { data, error, isFetching } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!isFetching) {
      if (data) {
        setUser(data)
      } else if (error) {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    }
  }, [data, error, isFetching, setUser, setLoading, setInitialized])

  return {
    user,
    isLoading: isLoading || (!isInitialized && isFetching),
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isModerator: user?.role === 'MODERATOR' || user?.role === 'ADMIN',
  }
}
