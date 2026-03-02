import { MessageCircle } from 'lucide-react'
import { useCommentsQuery } from '@/queries/posts.queries'
import { CommentItem } from './CommentItem'
import { CommentInput } from './CommentInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface CommentListProps {
  postId: number
}

export function CommentList({ postId }: CommentListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommentsQuery(postId)

  const comments = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <div className="space-y-4">
      <CommentInput postId={postId} />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <EmptyState icon={MessageCircle} title="No comments yet" description="Be the first to comment!" />
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="btn-ghost w-full text-sm"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more comments'}
        </button>
      )}
    </div>
  )
}
