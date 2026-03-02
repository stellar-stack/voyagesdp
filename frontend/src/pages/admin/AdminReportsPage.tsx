import { useState } from 'react'
import { toast } from 'sonner'
import { Flag, Check, X, Trash2, UserX, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useReportsQuery,
  useResolveReport,
  useAdminDeletePost,
  useAdminSuspendUser,
} from '@/queries/moderation.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { UserAvatar } from '@/components/user/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, cn, extractErrorMessage } from '@/lib/utils'
import type { Report, ReportStatus } from '@/types'

const tabs: ReportStatus[] = ['PENDING', 'RESOLVED', 'DISMISSED']

const statusStyle: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600',
  RESOLVED: 'bg-green-500/10 text-green-600',
  DISMISSED: 'bg-border text-text-muted',
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const { mutate: resolveReport, isPending: resolving } = useResolveReport()
  const { mutate: deletePost, isPending: deleting } = useAdminDeletePost()
  const { mutate: suspendUser, isPending: suspending } = useAdminSuspendUser()

  const isPending = report.status === 'PENDING'
  const acting = resolving || deleting || suspending

  const handleDeletePost = () => {
    if (!report.post) return
    deletePost(report.post.id, {
      onSuccess: () => toast.success('Post deleted and related reports resolved'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  const handleSuspend = (days: 1 | 7 | 30 | 90) => {
    suspendUser(
      { userId: report.reported_user.id, days },
      {
        onSuccess: () => {
          toast.success(`User suspended for ${days} day${days > 1 ? 's' : ''}`)
          setSuspendOpen(false)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar user={report.reported_user} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {report.reported_user.first_name} {report.reported_user.last_name}
            </p>
            <p className="text-xs text-text-muted">
              @{report.reported_user.username} · reported by @{report.reported_by.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusStyle[report.status])}>
            {report.status}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Reported post content */}
      {report.post && (
        <div className="bg-bg-secondary rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted font-medium">Reported post</p>
            <Link
              to={`/post/${report.post.id}`}
              className="text-xs text-accent flex items-center gap-1 hover:underline"
            >
              View <ExternalLink size={11} />
            </Link>
          </div>
          {report.post.caption && (
            <p className="text-sm font-medium text-text-primary">{report.post.caption}</p>
          )}
          {report.post.content && (
            <p className={cn('text-sm text-text-secondary', !expanded && 'line-clamp-2')}>
              {report.post.content}
            </p>
          )}
          {report.post.image && (
            <img
              src={report.post.image}
              alt="Reported"
              className={cn('rounded-lg w-full object-cover', expanded ? 'max-h-64' : 'max-h-24')}
            />
          )}
        </div>
      )}

      {/* Report reason */}
      <div className="bg-bg-secondary rounded-xl p-3">
        <p className="text-xs text-text-muted mb-1">Report reason</p>
        <p className="text-sm text-text-secondary">{report.reason}</p>
      </div>

      {/* Resolution info */}
      {report.resolved_by && (
        <p className="text-xs text-text-muted">
          {report.status} by @{report.resolved_by.username}
          {report.resolved_at ? ` · ${formatDate(report.resolved_at)}` : ''}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-text-muted">{formatDate(report.created_at)}</span>

        {isPending && (
          <div className="flex flex-wrap gap-2 justify-end">
            {/* Dismiss */}
            <button
              onClick={() => resolveReport({ reportId: report.id, action: 'DISMISSED' })}
              disabled={acting}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <X size={12} /> Dismiss
            </button>

            {/* Resolve */}
            <button
              onClick={() => resolveReport({ reportId: report.id, action: 'RESOLVED' })}
              disabled={acting}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Check size={12} /> Resolve
            </button>

            {/* Delete post */}
            {report.post && (
              <button
                onClick={handleDeletePost}
                disabled={acting}
                className="btn-secondary text-xs flex items-center gap-1 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={12} /> Delete Post
              </button>
            )}

            {/* Suspend user */}
            <div className="relative">
              <button
                onClick={() => setSuspendOpen((v) => !v)}
                disabled={acting}
                className="btn-secondary text-xs flex items-center gap-1 text-orange-500 hover:bg-orange-500/10"
              >
                <UserX size={12} /> Suspend
              </button>
              {suspendOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-bg-card border border-border rounded-xl shadow-lg p-1 min-w-[120px]">
                  {([1, 7, 30, 90] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => handleSuspend(days)}
                      disabled={suspending}
                      className="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-surface-hover text-text-primary"
                    >
                      {days} day{days > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('PENDING')
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReportsQuery(status)
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const reports = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Reports</h1>

      <div className="flex gap-1 rounded-xl bg-bg-secondary p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={cn(
              'flex-1 py-1.5 text-sm font-medium rounded-lg transition-all',
              status === tab ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-muted'
            )}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && reports.length === 0 && (
        <EmptyState icon={Flag} title={`No ${status.toLowerCase()} reports`} />
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <Skeleton className="h-24 rounded-2xl" />}
    </div>
  )
}
