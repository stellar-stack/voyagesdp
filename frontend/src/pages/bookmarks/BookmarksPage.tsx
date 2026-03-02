import { Bookmark } from 'lucide-react'
import { useBookmarksQuery } from '@/queries/posts.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function BookmarksPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarksQuery()
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const items = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Bookmarks</h1>

      {isLoading && (
        <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Save posts to read them later."
        />
      )}

      <div className="space-y-4">
        {items.map((bookmark) => (
          <PostCard key={bookmark.id} post={bookmark.post} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <PostSkeleton />}
    </div>
  )
}
