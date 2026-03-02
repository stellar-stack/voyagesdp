import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Share2, Bookmark, BookmarkCheck,
  MoreHorizontal, Edit, Trash2, Flag, ThumbsUp,
  Copy, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useToggleReaction, useToggleBookmark, useDeletePost, useSharePost } from '@/queries/posts.queries'
import { useUIStore } from '@/store/ui.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { cn, formatDate, formatCount } from '@/lib/utils'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
}

const shareMenuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

export function PostCard({ post }: PostCardProps) {
  const currentUser = useAuthStore((s) => s.user)
  const { openModal } = useUIStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  const { mutate: toggleReaction } = useToggleReaction(post.id)
  const { mutate: toggleBookmark } = useToggleBookmark()
  const { mutate: sharePost } = useSharePost()
  const { mutate: deletePost } = useDeletePost()

  const isOwner = currentUser?.username === post.user.username
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const isLiked = post.user_reaction === 'LIKE'

  // Close share menu when clicking outside
  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  const handleLike = () => {
    toggleReaction(isLiked ? null : 'LIKE')
  }

  const shareUrl = `${window.location.origin}/post/${post.id}`
  const shareText = post.caption ? `${post.caption} — ` : ''

  const handleShareOption = (action: 'whatsapp' | 'twitter' | 'copy') => {
    setShowShareMenu(false)
    // Record the share in backend (idempotent get_or_create)
    sharePost(post.id)

    if (action === 'whatsapp') {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`,
        '_blank',
        'noopener,noreferrer'
      )
    } else if (action === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        '_blank',
        'noopener,noreferrer'
      )
    } else if (action === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copied!')
      })
    }
  }

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return
    deletePost(post.id, {
      onSuccess: () => toast.success('Post deleted'),
      onError: () => toast.error('Failed to delete post'),
    })
  }

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
                variants={shareMenuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.12 }}
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
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors',
            isLiked
              ? 'text-accent bg-accent-muted'
              : 'text-text-muted hover:bg-surface-hover'
          )}
        >
          <ThumbsUp size={16} className={isLiked ? 'fill-accent' : ''} />
          {post.reactions_count > 0 && (
            <span>{formatCount(post.reactions_count)}</span>
          )}
        </motion.button>

        {/* Comment */}
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-text-muted hover:bg-surface-hover transition-colors"
        >
          <MessageCircle size={16} />
          {post.comments_count > 0 && <span>{formatCount(post.comments_count)}</span>}
        </Link>

        {/* Share — social dropdown */}
        <div className="relative" ref={shareMenuRef}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowShareMenu((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors',
              showShareMenu
                ? 'text-accent bg-accent-muted'
                : 'text-text-muted hover:bg-surface-hover'
            )}
          >
            <Share2 size={16} />
            {post.shares_count > 0 && <span>{formatCount(post.shares_count)}</span>}
          </motion.button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                variants={shareMenuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.12 }}
                className="absolute left-0 bottom-full mb-2 z-50 w-48 rounded-xl border border-border bg-bg-card shadow-xl py-1"
              >
                {/* WhatsApp */}
                <button
                  onClick={() => handleShareOption('whatsapp')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <span className="text-base leading-none">💬</span>
                  <span>WhatsApp</span>
                  <ExternalLink size={11} className="ml-auto text-text-muted" />
                </button>

                {/* Twitter / X */}
                <button
                  onClick={() => handleShareOption('twitter')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <span className="text-base leading-none">𝕏</span>
                  <span>Twitter / X</span>
                  <ExternalLink size={11} className="ml-auto text-text-muted" />
                </button>

                {/* Copy link */}
                <button
                  onClick={() => handleShareOption('copy')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <Copy size={14} />
                  <span>Copy Link</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
