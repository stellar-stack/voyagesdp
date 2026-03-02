import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAvatar } from '@/components/user/UserAvatar'
import { CommentInput } from './CommentInput'
import { formatDate } from '@/lib/utils'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment: Comment
  postId: number
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex gap-2.5">
        <Link to={`/profile/${comment.user.username}`} className="shrink-0">
          <UserAvatar user={comment.user} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-bg-secondary rounded-xl px-3 py-2">
            <Link
              to={`/profile/${comment.user.username}`}
              className="font-semibold text-xs text-text-primary hover:underline"
            >
              {comment.user.first_name} {comment.user.last_name}
            </Link>
            <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-2">
            <span className="text-xs text-text-muted">{formatDate(comment.created_at)}</span>
            <button
              onClick={() => setShowReply((s) => !s)}
              className="text-xs text-text-secondary hover:text-accent font-medium"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-10 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5">
              <Link to={`/profile/${reply.user.username}`} className="shrink-0">
                <UserAvatar user={reply.user} size="sm" />
              </Link>
              <div className="flex-1">
                <div className="bg-bg-secondary rounded-xl px-3 py-2">
                  <Link
                    to={`/profile/${reply.user.username}`}
                    className="font-semibold text-xs text-text-primary hover:underline"
                  >
                    {reply.user.first_name} {reply.user.last_name}
                  </Link>
                  <p className="text-sm text-text-primary mt-0.5">{reply.content}</p>
                </div>
                <span className="text-xs text-text-muted px-2 mt-1 block">
                  {formatDate(reply.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="ml-10">
          <CommentInput
            postId={postId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.user.first_name}…`}
            onSuccess={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  )
}
