import { useState } from 'react'
import { toast } from 'sonner'
import { useAddComment } from '@/queries/posts.queries'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { extractErrorMessage } from '@/lib/utils'

interface CommentInputProps {
  postId: number
  parentId?: number
  onSuccess?: () => void
  placeholder?: string
}

export function CommentInput({ postId, parentId, onSuccess, placeholder = 'Write a comment…' }: CommentInputProps) {
  const user = useAuthStore((s) => s.user)
  const { mutate: addComment, isPending } = useAddComment()
  const [content, setContent] = useState('')

  const submit = () => {
    if (!content.trim()) return
    addComment(
      { post_id: postId, content: content.trim(), parent: parentId },
      {
        onSuccess: () => {
          setContent('')
          onSuccess?.()
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  if (!user) return null

  return (
    <div className="flex gap-2.5">
      <UserAvatar user={user} size="sm" className="mt-1 shrink-0" />
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={1000}
          rows={1}
          className="input-base text-sm resize-none pr-16 min-h-[40px]"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = `${t.scrollHeight}px`
          }}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <span className="text-xs text-text-muted">{content.length}/1000</span>
          <button
            onClick={submit}
            disabled={isPending || !content.trim()}
            className="btn-primary text-xs px-2.5 py-1"
          >
            {isPending ? '…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
