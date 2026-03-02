import { cn, getInitials, getMediaUrl } from '@/lib/utils'
import type { UserPublic } from '@/types'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xl2'

const sizeMap: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  xl2: 'h-20 w-20 text-xl',
}

interface UserAvatarProps {
  user: Pick<UserPublic, 'profile_picture' | 'first_name' | 'last_name' | 'username'>
  size?: AvatarSize
  className?: string
  ring?: boolean
}

export function UserAvatar({ user, size = 'md', className, ring }: UserAvatarProps) {
  const url = getMediaUrl(user.profile_picture)
  const initials = getInitials(user.first_name, user.last_name)

  return url ? (
    <img
      src={url}
      alt={user.username}
      className={cn(
        'rounded-full object-cover shrink-0',
        sizeMap[size],
        ring && 'ring-2 ring-accent/40 ring-offset-2 ring-offset-bg-card',
        className
      )}
    />
  ) : (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-accent-muted to-violet-500/10 flex items-center justify-center font-semibold text-accent shrink-0',
        sizeMap[size],
        ring && 'ring-2 ring-accent/40 ring-offset-2 ring-offset-bg-card',
        className
      )}
    >
      {initials}
    </div>
  )
}
