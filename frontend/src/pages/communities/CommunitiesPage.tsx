import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search } from 'lucide-react'
import { useCommunitiesQuery } from '@/queries/communities.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { CommunityCard } from '@/components/community/CommunityCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CommunitiesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunitiesQuery()
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const communities = (data?.pages.flatMap((p) => p.results) ?? []).filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Communities</h1>
        <button
          onClick={() => navigate('/communities/create')}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities…"
          className="input-base pl-9"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 flex gap-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && communities.length === 0 && (
        <EmptyState
          icon={Users}
          title="No communities found"
          description="Create one to get started!"
          action={
            <button onClick={() => navigate('/communities/create')} className="btn-primary">
              Create Community
            </button>
          }
        />
      )}

      <div className="space-y-3">
        {communities.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <div className="text-center text-text-muted text-sm py-4">Loading…</div>}
    </div>
  )
}
