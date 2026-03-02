import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Share2, Bookmark, BookmarkCheck,
  MoreHorizontal, Edit, Trash2, Flag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useToggleReaction, useToggleBookmark, useDeletePost } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { ReactionPicker } from './ReactionPicker'
import { REACTION_EMOJIS } from '@/lib/constants'
import { cn, formatDate, formatCount } from '@/lib/utils'
import type { Post, ReactionType } from '@/types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const currentUser = useAuthStore((s) => s.user)
  const { openModal } = useUIStore()
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const { mutate: toggleReaction } = useToggleReaction(post.id)
  const { mutate: toggleBookmark } = useToggleBookmark()
  const { mutate: deletePost } = useDeletePost()

  const isOwner = currentUser?.username === post.user.username
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'

  const handleReact = (type: ReactionType) => {
    toggleReaction(type)
    setShowReactions(false)
  }

  const handleRemoveReaction = () => {
    toggleReaction(null)
    setShowReactions(false)
  }

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return
    deletePost(post.id, {
      onSuccess: () => toast.success('Post deleted'),
      onError: () => toast.error('Failed to delete post'),
    })
  }

  // Show top 2 reaction types
  const topReactions = Object.entries(post.reactions_summary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([type]) => REACTION_EMOJIS[type as ReactionType]?.emoji)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      className="card-hover p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-2.5">
          <UserAvatar user={post.user} size="md" />
          <div>
            <p className="font-semibold text-sm text-text-primary hover:underline">
              {post.user.first_name} {post.user.last_name}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>@{post.user.username}</span>
              <span>·</span>
              <span>{formatDate(post.created_at)}</span>
              {post.community && (
                <>
                  <span>·</span>
                  <span className="text-accent font-medium">c/{post.community}</span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-border bg-bg-card shadow-xl py-1"
                onMouseLeave={() => setShowMenu(false)}
              >
                {(isOwner || isAdminOrMod) && (
                  <>
                    {isOwner && (
                      <button
                        onClick={() => { setShowMenu(false); openModal('edit-post', post) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); handleDelete() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
                {!isOwner && (
                  <button
                    onClick={() => { setShowMenu(false); openModal('report', { postId: post.id }) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                  >
                    <Flag size={14} /> Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {post.caption && (
        <p className="font-medium text-text-primary text-sm">{post.caption}</p>
      )}
      {post.content && (
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.post_type === 'IMAGE' && post.image && (
        <img
          src={post.image}
          alt={post.caption || 'Post image'}
          className="w-full max-h-80 object-cover rounded-xl border border-border"
          loading="lazy"
        />
      )}
      {post.post_type === 'VIDEO' && post.video && (
        <video
          src={post.video}
          controls
          className="w-full max-h-80 rounded-xl border border-border"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        {/* Reaction */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => {
              if (post.user_reaction) handleRemoveReaction()
              else setShowReactions(true)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors',
              post.user_reaction
                ? 'text-accent bg-accent-muted'
                : 'text-text-muted hover:bg-surface-hover'
            )}
          >
            <span className="text-base leading-none">
              {post.user_reaction
                ? REACTION_EMOJIS[post.user_reaction].emoji
                : topReactions.length > 0
                  ? topReactions[0]
                  : '👍'}
            </span>
            {post.reactions_count > 0 && (
              <span>{formatCount(post.reactions_count)}</span>
            )}
          </button>
          <AnimatePresence>
            {showReactions && (
              <div
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <ReactionPicker
                  currentReaction={post.user_reaction}
                  onSelect={handleReact}
                  onRemove={handleRemoveReaction}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-text-muted hover:bg-surface-hover transition-colors"
        >
          <MessageCircle size={16} />
          {post.comments_count > 0 && <span>{formatCount(post.comments_count)}</span>}
        </Link>

        {/* Share */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-text-muted hover:bg-surface-hover transition-colors">
          <Share2 size={16} />
          {post.shares_count > 0 && <span>{formatCount(post.shares_count)}</span>}
        </button>

        {/* Bookmark */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleBookmark(post.id)}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors',
            post.is_bookmarked ? 'text-accent' : 'text-text-muted hover:bg-surface-hover'
          )}
        >
          {post.is_bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </motion.button>
      </div>
    </motion.article>
  )
}
