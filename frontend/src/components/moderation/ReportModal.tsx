import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '@/store/ui.store'
import { useCreateReport } from '@/queries/moderation.queries'
import { extractErrorMessage } from '@/lib/utils'

export function ReportModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const { mutate: createReport, isPending } = useCreateReport()
  const [reason, setReason] = useState('')

  const postId = (modalData as { postId?: number })?.postId

  const handleSubmit = () => {
    if (!postId || reason.trim().length < 10) {
      toast.error('Please describe the issue in at least 10 characters')
      return
    }
    createReport(
      { post: postId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Report submitted. Thank you.')
          closeModal()
          setReason('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <Dialog.Root open={activeModal === 'report'} onOpenChange={(o) => !o && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ x: '-50%', y: '-50%' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md rounded-2xl border border-border bg-bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Dialog.Title className="font-semibold text-text-primary">Report Post</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary">
                Describe why you're reporting this post. Our moderation team will review it.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue (min 10 characters)…"
                rows={4}
                maxLength={500}
                className="input-base resize-none text-sm"
              />
              <p className="text-xs text-text-muted text-right">{reason.length}/500</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <Dialog.Close className="btn-secondary">Cancel</Dialog.Close>
              <button
                onClick={handleSubmit}
                disabled={isPending || reason.trim().length < 10}
                className="btn-danger flex items-center gap-2"
              >
                {isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Submit Report
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
