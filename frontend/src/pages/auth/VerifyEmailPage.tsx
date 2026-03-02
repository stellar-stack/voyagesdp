import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { authApi } from '@/api'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const token = params.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [params])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 max-w-sm w-full text-center space-y-4"
      >
        {status === 'loading' && (
          <>
            <Loader className="mx-auto animate-spin text-accent" size={40} />
            <p className="text-text-secondary">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto text-green-500" size={40} />
            <h2 className="text-xl font-bold text-text-primary">Email verified!</h2>
            <p className="text-text-secondary">
              Your email has been verified successfully.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Sign in now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto text-danger" size={40} />
            <h2 className="text-xl font-bold text-text-primary">Verification failed</h2>
            <p className="text-text-secondary">
              This link is invalid or has expired.
            </p>
            <Link to="/login" className="btn-secondary inline-block">
              Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
