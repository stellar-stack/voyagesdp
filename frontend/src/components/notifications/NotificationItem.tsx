import {
  UserPlus, Heart, MessageCircle, MessageSquare,
  Shield, Ban, Info, Bell,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useMarkNotificationRead } from '@/queries/moderation.queries'
import type { Notification, NotifType } from '@/types'

const iconMap: Record<NotifType, typeof Bell> = {
  FOLLOW: UserPlus,
  REACTION: Heart,
  COMMENT: MessageCircle,
  MESSAGE: MessageSquare,
  AI_VIOLATION: Shield,
  SUSPENSION: Ban,
  SYSTEM: Info,
  REPORT_USER: Bell,
  REPORT_ADMIN: Bell,
}

const colorMap: Record<NotifType, string> = {
  FOLLOW: 'text-blue-500',
  REACTION: 'text-red-500',
  COMMENT: 'text-accent',
  MESSAGE: 'text-green-500',
  AI_VIOLATION: 'text-yellow-500',
  SUSPENSION: 'text-danger',
  SYSTEM: 'text-text-muted',
  REPORT_USER: 'text-orange-500',
  REPORT_ADMIN: 'text-orange-500',
}

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markRead } = useMarkNotificationRead()
  const Icon = iconMap[notification.notif_type] ?? Bell
  const iconColor = colorMap[notification.notif_type] ?? 'text-text-muted'

  return (
    <div
      onClick={() => !notification.is_read && markRead(notification.id)}
      className={cn(
        'flex items-start gap-3 p-4 hover:bg-surface-hover transition-colors cursor-pointer',
        !notification.is_read && 'bg-accent-muted/30'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', iconColor)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.is_read ? 'text-text-primary font-medium' : 'text-text-secondary')}>
          {notification.message}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{formatDate(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
      )}
    </div>
  )
}
