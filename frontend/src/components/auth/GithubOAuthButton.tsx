import { Github } from 'lucide-react'

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string

export default function GithubOAuthButton() {
  const handleClick = () => {
    const state = crypto.randomUUID()
    sessionStorage.setItem('github_oauth_state', state)

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID ?? '',
      scope: 'user:email',
      state,
      redirect_uri: `${window.location.origin}/oauth/callback/github`,
    })

    window.location.href = `https://github.com/login/oauth/authorize?${params}`
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
    >
      <Github size={18} />
      Continue with GitHub
    </button>
  )
}
