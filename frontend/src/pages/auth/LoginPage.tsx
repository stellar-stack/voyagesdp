import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useLogin } from '@/queries/auth.queries'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { extractErrorMessage } from '@/lib/utils'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import GithubOAuthButton from '@/components/auth/GithubOAuthButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => navigate('/feed'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1 text-text-secondary">Sign in to your Voyage account</p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-6">
          {/* OAuth buttons */}
          <div className="space-y-3">
            <GoogleOAuthButton />
            <GithubOAuthButton />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Username
              </label>
              <input
                {...register('username')}
                placeholder="your_username"
                className="input-base"
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-base"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
