import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/store/ui.store'
import { useEditPost } from '@/queries/posts.queries'
import type { Post } from '@/types'

export function EditPostModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const { mutate: editPost, isPending } = useEditPost()

  const post = modalData as Post | null
  const isOpen = activeModal === 'edit-post' && !!post

  const [caption, setCaption] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (isOpen && post) {
      setCaption(post.caption ?? '')
      setContent(post.content ?? '')
    }
  }, [isOpen, post])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!post) return
    editPost(
      { postId: post.id, payload: { caption, content } },
      {
        onSuccess: () => {
          toast.success('Post updated')
          closeModal()
        },
        onError: () => toast.error('Failed to update post'),
      }
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{ x: '-50%', y: '-50%' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                Edit Post
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Caption</label>
                <input
                  className="input-base"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Post caption…"
                  maxLength={300}
                />
              </div>

              {post?.post_type === 'TEXT' && (
                <div>
                  <label className="label">Content</label>
                  <textarea
                    className="input-base min-h-[120px] resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-ghost"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
