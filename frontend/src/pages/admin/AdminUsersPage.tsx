import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { authApi } from '@/api'
import { useDebounce } from '@/hooks/useDebounce'
import { UserAvatar } from '@/components/user/UserAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, extractErrorMessage, formatCount } from '@/lib/utils'
import { format } from 'date-fns'
import type { UserAdmin } from '@/types'

function useAllUsers(page: number, q: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, q],
    queryFn: () => authApi.listAllUsers(page, q),
    staleTime: 1000 * 30,
  })
}

function UserRow({ user, onRefresh }: { user: UserAdmin; onRefresh: () => void }) {
  const qc = useQueryClient()
  const [suspendOpen, setSuspendOpen] = useState(false)

  const { mutate: suspend, isPending: suspending } = useMutation({
    mutationFn: ({ days }: { days: 1 | 7 | 30 | 90 }) => authApi.suspendUser(user.id, days),
    onSuccess: (_, { days }) => {
      toast.success(`@${user.username} suspended for ${days} days`)
      setSuspendOpen(false)
      onRefresh()
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const { mutate: clearViolations, isPending: clearing } = useMutation({
    mutationFn: () => authApi.clearViolations(user.id),
    onSuccess: () => {
      toast.success('Violations cleared')
      onRefresh()
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const { mutate: promote, isPending: promoting } = useMutation({
    mutationFn: (role: 'USER' | 'MODERATOR') => authApi.promoteUser(user.id, role),
    onSuccess: () => {
      toast.success('Role updated')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const isSuspended = user.suspended_until && new Date(user.suspended_until) > new Date()
  const acting = suspending || clearing || promoting

  return (
    <div className="card p-4 space-y-3">
      {/* User info */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${user.username}`}>
          <UserAvatar user={user} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${user.username}`}
              className="font-medium text-text-primary hover:underline text-sm"
            >
              {user.first_name} {user.last_name}
            </Link>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                user.role === 'ADMIN'
                  ? 'bg-red-500/10 text-red-500'
                  : user.role === 'MODERATOR'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-border text-text-muted'
              )}
            >
              {user.role}
            </span>
            {isSuspended && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                Suspended
              </span>
            )}
            {!user.is_active && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">
                Banned
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            @{user.username} · {formatCount(user.followers_count)} followers ·{' '}
            {user.violation_count} violation{user.violation_count !== 1 ? 's' : ''}
            {user.date_joined ? ` · Joined ${format(new Date(user.date_joined), 'MMM yyyy')}` : ''}
          </p>
          {isSuspended && user.suspended_until && (
            <p className="text-xs text-orange-500 mt-0.5">
              Suspended until {format(new Date(user.suspended_until), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Suspend dropdown */}
        <div className="relative">
          <button
            onClick={() => setSuspendOpen((v) => !v)}
            disabled={acting || user.role === 'ADMIN'}
            className="btn-secondary text-xs"
          >
            Suspend
          </button>
          {suspendOpen && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-bg-card border border-border rounded-xl shadow-lg p-1 min-w-[120px]">
              {([1, 7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => suspend({ days })}
                  disabled={suspending}
                  className="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-surface-hover text-text-primary"
                >
                  {days} day{days > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear violations */}
        {user.violation_count > 0 && (
          <button
            onClick={() => clearViolations()}
            disabled={acting}
            className="btn-secondary text-xs"
          >
            Clear Violations ({user.violation_count})
          </button>
        )}

        {/* Promote / demote */}
        {user.role === 'USER' && (
          <button
            onClick={() => promote('MODERATOR')}
            disabled={acting}
            className="btn-primary text-xs"
          >
            Make Moderator
          </button>
        )}
        {user.role === 'MODERATOR' && (
          <button
            onClick={() => promote('USER')}
            disabled={acting}
            className="btn-secondary text-xs"
          >
            Remove Moderator
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const qc = useQueryClient()

  const { data, isLoading } = useAllUsers(page, debouncedQuery)

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">User Management</h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, username or email…"
          className="input-base pl-9"
        />
      </div>

      {/* Stats row */}
      {data && (
        <p className="text-sm text-text-muted">
          {data.count.toLocaleString()} user{data.count !== 1 ? 's' : ''}
          {debouncedQuery ? ` matching "${debouncedQuery}"` : ' total'}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.results ?? []).map((user) => (
            <UserRow key={user.id} user={user} onRefresh={refresh} />
          ))}
          {(data?.results ?? []).length === 0 && (
            <p className="text-center text-text-muted py-12 text-sm">No users found</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
