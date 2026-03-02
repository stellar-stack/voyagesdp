import { cn, getInitials, getMediaUrl } from '@/lib/utils'
import type { UserPublic } from '@/types'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

interface UserAvatarProps {
  user: Pick<UserPublic, 'profile_picture' | 'first_name' | 'last_name' | 'username'>
  size?: AvatarSize
  className?: string
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const url = getMediaUrl(user.profile_picture)
  const initials = getInitials(user.first_name, user.last_name)

  return url ? (
    <img
      src={url}
      alt={user.username}
      className={cn('rounded-full object-cover shrink-0', sizeMap[size], className)}
    />
  ) : (
    <div
      className={cn(
        'rounded-full bg-accent-muted flex items-center justify-center font-semibold text-accent shrink-0',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
