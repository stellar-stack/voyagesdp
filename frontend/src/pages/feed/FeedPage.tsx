import { Newspaper, PenSquare } from 'lucide-react'
import { useFeedQuery } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FeedPage() {
  const { openModal } = useUIStore()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedQuery()

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const posts = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      {/* Create post trigger */}
      <button
        onClick={() => openModal('create-post')}
        className="card w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors cursor-pointer text-left"
      >
        <div className="h-10 w-10 rounded-full bg-accent-muted flex items-center justify-center">
          <PenSquare size={18} className="text-accent" />
        </div>
        <span className="text-text-muted text-sm">What's on your mind?</span>
      </button>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      )}

      {/* Posts */}
      {!isLoading && posts.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Your feed is empty"
          description="Follow people or join communities to see posts here."
          action={
            <button onClick={() => openModal('create-post')} className="btn-primary">
              Create your first post
            </button>
          }
        />
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="space-y-4">
          {[1, 2].map((i) => <PostSkeleton key={i} />)}
        </div>
      )}

    </div>
  )
}
