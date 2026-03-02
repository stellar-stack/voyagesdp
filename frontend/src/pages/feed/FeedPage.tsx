import { Newspaper, Image, Video } from 'lucide-react'
import { useFeedQuery } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserAvatar } from '@/components/user/UserAvatar'
import { Link } from 'react-router-dom'

export default function FeedPage() {
  const { openModal } = useUIStore()
  const user = useAuthStore((s) => s.user)
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
        className="card w-full flex items-center gap-3.5 p-4 hover:bg-surface-hover hover:shadow-sm transition-all duration-200 cursor-pointer text-left"
      >
        {user && <UserAvatar user={user} size="md" />}
        <div className="flex-1">
          <span className="text-text-muted text-sm">What&apos;s on your mind?</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <div className="p-1.5 rounded-lg bg-accent-muted text-accent">
            <Image size={15} />
          </div>
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
            <Video size={15} />
          </div>
        </div>
      </button>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Your feed is empty"
          description="Join communities to see posts from people who share your interests."
          action={
            <Link to="/communities" className="btn-gradient text-sm">
              Browse Communities
            </Link>
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
