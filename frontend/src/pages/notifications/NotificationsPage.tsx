import { Bell, CheckCheck } from 'lucide-react'
import { useNotificationsQuery, useMarkAllRead } from '@/queries/moderation.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function NotificationsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationsQuery()
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead()
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const notifications = data?.pages.flatMap((p) => p.results) ?? []
  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        {hasUnread && (
          <button
            onClick={() => markAllRead()}
            disabled={markingAll}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="card divide-y divide-border overflow-hidden">
        {isLoading && [1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <Skeleton className="h-5 w-5 rounded-full mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}

        {!isLoading && notifications.length === 0 && (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        )}

        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
    </div>
  )
}
