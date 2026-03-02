import { useParams } from 'react-router-dom'
import { Users, List, PenSquare } from 'lucide-react'
import { useCommunityDetail, useToggleJoin } from '@/queries/communities.queries'
import { useCommunityFeedQuery } from '@/queries/posts.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useUIStore } from '@/store/ui.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCount, getMediaUrl } from '@/lib/utils'

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const id = Number(communityId)
  const { openModal } = useUIStore()
  const { data: community, isLoading } = useCommunityDetail(id)
  const { mutate: toggleJoin, isPending: joiningPending } = useToggleJoin(id)
  const { data: feedData, isLoading: feedLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommunityFeedQuery(id)
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const posts = feedData?.pages.flatMap((p) => p.results) ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="card p-5 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (!community) return <div className="text-center text-text-muted py-16">Community not found</div>

  const bannerUrl = getMediaUrl(community.banner)
  const rules = community.rules ? community.rules.split('\n').filter(Boolean) : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="banner" className="w-full h-32 object-cover" />
        ) : (
          <div className="h-32 bg-gradient-to-br from-accent/30 to-purple-500/20" />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-text-primary">{community.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-text-muted mt-0.5">
                <Users size={14} />
                <span>{formatCount(community.members_count)} members</span>
              </div>
            </div>
            <button
              onClick={() => toggleJoin()}
              disabled={joiningPending}
              className={community.is_member ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
            >
              {joiningPending ? '…' : community.is_member ? 'Leave' : 'Join'}
            </button>
          </div>

          <p className="text-text-secondary text-sm">{community.about}</p>

          {/* Moderators */}
          {community.moderators.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-text-muted mb-2">Moderators</p>
              <div className="flex gap-1.5">
                {community.moderators.map((mod) => (
                  <UserAvatar key={mod.id} user={mod} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules */}
      {rules.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <List size={16} className="text-accent" />
            <h2 className="font-semibold text-text-primary text-sm">Community Rules</h2>
          </div>
          <ol className="space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-text-secondary">
                <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Create post (members only) */}
      {community.is_member && (
        <button
          onClick={() => openModal('create-post', { communityId: id })}
          className="card w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors cursor-pointer text-left"
        >
          <div className="h-9 w-9 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
            <PenSquare size={16} className="text-accent" />
          </div>
          <span className="text-text-muted text-sm">Post something to this community…</span>
        </button>
      )}

      {/* Posts */}
      <h2 className="font-semibold text-text-primary">Posts</h2>
      {feedLoading && <div className="space-y-4">{[1, 2].map((i) => <PostSkeleton key={i} />)}</div>}
      <div className="space-y-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <PostSkeleton />}
    </div>
  )
}
