import { useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchUsers } from '@/queries/auth.queries'
import { useDebounce } from '@/hooks/useDebounce'
import { UserCard } from '@/components/user/UserCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const { data: users, isLoading } = useSearchUsers(debouncedQuery)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Search</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or username…"
          autoFocus
          className="input-base pl-10 text-sm"
        />
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="card divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && (users ?? []).length === 0 && (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No users matched "${debouncedQuery}"`}
        />
      )}

      {(users ?? []).length > 0 && (
        <div className="card divide-y divide-border">
          {(users ?? []).map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {debouncedQuery.length < 2 && (
        <div className="text-center text-text-muted text-sm py-12">
          Type at least 2 characters to search
        </div>
      )}
    </div>
  )
}
