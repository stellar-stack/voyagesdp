import { Link } from 'react-router-dom'
import { UserAvatar } from './UserAvatar'
import { FollowButton } from './FollowButton'
import { useAuthStore } from '@/store/auth.store'
import type { UserPublic } from '@/types'

interface UserCardProps {
  user: UserPublic
}

export function UserCard({ user }: UserCardProps) {
  const currentUser = useAuthStore((s) => s.user)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors">
      <Link to={`/profile/${user.username}`} className="shrink-0">
        <UserAvatar user={user} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.username}`} className="hover:underline">
          <p className="font-medium text-text-primary text-sm truncate">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-text-muted truncate">@{user.username}</p>
        </Link>
      </div>
      <FollowButton
        username={user.username}
        isFollowing={user.is_following}
        currentUsername={currentUser?.username}
      />
    </div>
  )
}
