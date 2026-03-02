import { Shield, CheckCircle } from 'lucide-react'
import { useAiViolationsQuery, useMarkFalsePositive } from '@/queries/moderation.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { UserAvatar } from '@/components/user/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, cn } from '@/lib/utils'

const actionColors: Record<string, string> = {
  WARNED: 'bg-yellow-500/10 text-yellow-600',
  SUSPENDED_7: 'bg-orange-500/10 text-orange-600',
  SUSPENDED_30: 'bg-red-500/10 text-red-500',
  BANNED: 'bg-red-700/10 text-red-700',
}

export default function AdminViolationsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAiViolationsQuery()
  const { mutate: markFalsePositive } = useMarkFalsePositive()
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const violations = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-text-primary">AI Violation Logs</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && violations.length === 0 && (
        <EmptyState icon={Shield} title="No violations logged" description="The AI hasn't flagged any content yet." />
      )}

      <div className="space-y-3">
        {violations.map((v) => (
          <div
            key={v.id}
            className={cn('card p-4 space-y-3', v.is_false_positive && 'opacity-60')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar user={v.user} size="sm" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {v.user.first_name} {v.user.last_name}
                  </p>
                  <p className="text-xs text-text-muted">@{v.user.username} · Violation #{v.violation_number}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', actionColors[v.action_taken] ?? '')}>
                  {v.action_taken.replace('_', ' ')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted">
                  {v.content_type}
                </span>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl p-3 space-y-2">
              <p className="text-xs text-text-muted">Removed content:</p>
              <p className="text-sm text-text-secondary line-clamp-3 italic">"{v.content_text}"</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-danger font-medium">{v.reason}</p>
                <p className="text-xs text-text-muted">{formatDate(v.flagged_at)}</p>
              </div>

              {v.is_false_positive ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={13} /> Marked false positive
                </div>
              ) : (
                <button
                  onClick={() => markFalsePositive(v.id)}
                  className="btn-secondary text-xs"
                >
                  Mark False Positive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
    </div>
  )
}
