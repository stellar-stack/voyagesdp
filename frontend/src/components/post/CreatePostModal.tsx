import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { X, Image, Video, Type, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/store/ui.store'
import { useCreatePost } from '@/queries/posts.queries'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { extractErrorMessage } from '@/lib/utils'
import type { PostType } from '@/types'

const tabs: { type: PostType; icon: typeof Type; label: string }[] = [
  { type: 'TEXT', icon: Type, label: 'Text' },
  { type: 'IMAGE', icon: Image, label: 'Image' },
  { type: 'VIDEO', icon: Video, label: 'Video' },
]

export function CreatePostModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const communityId = (modalData as { communityId?: number } | null)?.communityId
  const { mutate: createPost, isPending } = useCreatePost(communityId)

  const [postType, setPostType] = useState<PostType>('TEXT')
  const [caption, setCaption] = useState('')
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  const { getRootProps, getInputProps } = useDropzone({
    accept: postType === 'IMAGE' ? { 'image/*': [] } : { 'video/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
    },
  })

  const handleClose = () => {
    closeModal()
    setCaption('')
    setContent('')
    setMediaFile(null)
    setMediaPreview(null)
    setPostType('TEXT')
  }

  const handleSubmit = () => {
    if (postType === 'TEXT' && !content.trim() && !caption.trim()) {
      toast.error('Write something to post')
      return
    }
    if ((postType === 'IMAGE' || postType === 'VIDEO') && !mediaFile) {
      toast.error(`Please select a ${postType.toLowerCase()} file`)
      return
    }

    createPost(
      {
        post_type: postType,
        caption: caption.trim() || undefined,
        content: postType === 'TEXT' ? content.trim() : undefined,
        image: postType === 'IMAGE' ? mediaFile! : undefined,
        video: postType === 'VIDEO' ? mediaFile! : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Post created!')
          handleClose()
        },
        onError: (err) => {
          const msg = extractErrorMessage(err)
          const is451 = (err as { response?: { status?: number } }).response?.status === 451
          if (is451) toast.error(`Post removed: ${msg}`)
          else toast.error(msg)
        },
      }
    )
  }

  return (
    <Dialog.Root open={activeModal === 'create-post'} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ x: '-50%', y: '-50%' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg rounded-2xl border border-border bg-bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Dialog.Title className="font-semibold text-text-primary">
                {communityId ? 'Post to Community' : 'Create Post'}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-4">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={user} size="md" />
                  <div>
                    <p className="font-medium text-sm text-text-primary">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-text-muted">@{user.username}</p>
                  </div>
                </div>
              )}

              {/* Type tabs */}
              <div className="flex gap-1 rounded-xl bg-bg-secondary p-1">
                {tabs.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => { setPostType(type); setMediaFile(null); setMediaPreview(null) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      postType === type
                        ? 'bg-bg-card text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                maxLength={255}
                rows={1}
                className="input-base resize-none text-sm"
              />

              {/* Content (text only) */}
              {postType === 'TEXT' && (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="input-base resize-none text-sm"
                />
              )}

              {/* Media dropzone */}
              {(postType === 'IMAGE' || postType === 'VIDEO') && (
                <div>
                  {mediaPreview ? (
                    <div className="relative">
                      {postType === 'IMAGE' ? (
                        <img
                          src={mediaPreview}
                          alt="preview"
                          className="w-full max-h-60 object-cover rounded-xl border border-border"
                        />
                      ) : (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full max-h-60 rounded-xl border border-border"
                        />
                      )}
                      <button
                        onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="cursor-pointer flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-text-muted hover:border-accent hover:text-accent transition-colors"
                    >
                      <input {...getInputProps()} />
                      <Upload size={24} />
                      <p className="text-sm">
                        Drop {postType === 'IMAGE' ? 'an image' : 'a video'} here or click to browse
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <button onClick={handleClose} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="btn-primary flex items-center gap-2"
              >
                {isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
