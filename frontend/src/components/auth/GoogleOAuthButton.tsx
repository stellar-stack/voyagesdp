import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/queries/queryClient'
import { extractErrorMessage } from '@/lib/utils'

export default function GoogleOAuthButton() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const qc = useQueryClient()

  return (
    <GoogleLogin
      onSuccess={async ({ credential }) => {
        if (!credential) return
        try {
          await authApi.googleOAuth(credential)
          const user = await authApi.getMe()
          setUser(user)
          qc.setQueryData(QUERY_KEYS.ME, user)
          navigate('/feed')
        } catch (err) {
          toast.error(extractErrorMessage(err))
        }
      }}
      onError={() => toast.error('Google sign-in failed')}
      useOneTap={false}
      shape="rectangular"
      size="large"
      width="100%"
      text="signin_with"
    />
  )
}
