import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { usePostQuery } from '@/queries/posts.queries'
import { PostCard } from '@/components/post/PostCard'
import { CommentList } from '@/components/comment/CommentList'
import { PostSkeleton } from '@/components/post/PostSkeleton'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const id = Number(postId)

  const { data: post, isLoading, error } = usePostQuery(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <div className="card p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="h-8 w-8 rounded-full bg-surface-hover animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-12 rounded-xl bg-surface-hover animate-pulse" />
                <div className="h-3 w-16 rounded bg-surface-hover animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="card p-8 text-center text-text-muted">
        <p className="text-lg font-medium">Post not found</p>
        <p className="text-sm mt-1">This post may have been deleted or doesn't exist.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Go back
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Post */}
      <PostCard post={post} />

      {/* Comments */}
      <div className="card p-4">
        <h2 className="font-semibold text-text-primary mb-4">
          Comments
          {post.comments_count > 0 && (
            <span className="ml-2 text-sm font-normal text-text-muted">
              ({post.comments_count})
            </span>
          )}
        </h2>
        <CommentList postId={post.id} />
      </div>

    </motion.div>
  )
}
