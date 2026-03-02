import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRegister } from '@/queries/auth.queries'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { extractErrorMessage } from '@/lib/utils'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import GithubOAuthButton from '@/components/auth/GithubOAuthButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: registerUser, isPending } = useRegister()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    },
  })

  const onSubmit = (data: RegisterInput) => {
    registerUser(
      { ...data, profile_picture: avatarFile ?? undefined },
      {
        onSuccess: () => {
          toast.success('Account created! Check your email to verify your account.')
          navigate('/login')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="mt-1 text-text-secondary">Join the Voyage community</p>
        </div>

        <div className="card p-8 space-y-6">
          {/* OAuth */}
          <div className="space-y-3">
            <GoogleOAuthButton />
            <GithubOAuthButton />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or register with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex justify-center">
              <div
                {...getRootProps()}
                className="relative cursor-pointer rounded-full"
              >
                <input {...getInputProps()} />
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-accent"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors">
                    <User size={20} className="text-text-muted" />
                    <Upload size={12} className="text-text-muted" />
                  </div>
                )}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register('first_name')}
                  placeholder="First name"
                  className="input-base"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-danger">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <input
                  {...register('last_name')}
                  placeholder="Last name"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <input
                {...register('username')}
                placeholder="Username"
                className="input-base"
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
              )}
            </div>

            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email address"
                className="input-base"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="Password (min 8 characters)"
                className="input-base"
                autoComplete="new-password"
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
              {isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
