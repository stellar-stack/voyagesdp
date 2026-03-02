import { useState, useEffect, useRef } from 'react'
import { useToggleFollow } from '@/queries/auth.queries'

interface FollowButtonProps {
  username: string
  isFollowing: boolean
  currentUsername?: string
}

export function FollowButton({ username, isFollowing: serverFollowing, currentUsername }: FollowButtonProps) {
  const [following, setFollowing] = useState(serverFollowing)
  const { mutate, isPending } = useToggleFollow(username)

  // Tracks whether a mutation we fired is still in-flight.
  // Prevents the useEffect from resetting local state to the stale serverFollowing
  // value that arrives between mutation-resolve and the background re-fetch settling.
  const mutationInFlight = useRef(false)

  // Only sync from server when no mutation is running. This avoids the race where:
  // mutation resolves → isPending=false → useEffect fires with stale serverFollowing
  // → resets button to wrong state before the re-fetch corrects it.
  useEffect(() => {
    if (!mutationInFlight.current) {
      setFollowing(serverFollowing)
    }
  }, [serverFollowing])

  if (username === currentUsername) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const next = !following
    setFollowing(next)
    mutationInFlight.current = true
    mutate(undefined, {
      onSettled: () => {
        mutationInFlight.current = false
      },
      onError: () => {
        setFollowing(!next)
      },
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={
        following
          ? 'group btn-secondary text-sm px-4 py-1.5 min-w-[96px]'
          : 'btn-primary text-sm px-4 py-1.5 min-w-[96px]'
      }
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          {following ? 'Following…' : 'Unfollowing…'}
        </span>
      ) : following ? (
        <span>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline text-red-500">Unfollow</span>
        </span>
      ) : (
        'Follow'
      )}
    </button>
  )
}
