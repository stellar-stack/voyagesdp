import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/queries/queryClient'
import { extractErrorMessage } from '@/lib/utils'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const qc = useQueryClient()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('github_oauth_state')

    if (!code || !state || state !== savedState) {
      toast.error('Invalid OAuth state. Please try again.')
      navigate('/login')
      return
    }

    sessionStorage.removeItem('github_oauth_state')

    authApi
      .githubOAuth(code)
      .then(() => authApi.getMe())
      .then((user) => {
        setUser(user)
        qc.setQueryData(QUERY_KEYS.ME, user)
        navigate('/feed')
      })
      .catch((err) => {
        toast.error(extractErrorMessage(err))
        navigate('/login')
      })
  }, [params, navigate, setUser, qc])

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent mx-auto" />
        <p className="text-text-secondary text-sm">Completing sign-in…</p>
      </div>
    </div>
  )
}
