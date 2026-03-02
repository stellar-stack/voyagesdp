import { motion, AnimatePresence } from 'framer-motion'
import { REACTION_EMOJIS } from '@/lib/constants'
import type { ReactionType } from '@/types'

interface ReactionPickerProps {
  currentReaction: ReactionType | null
  onSelect: (type: ReactionType) => void
  onRemove: () => void
}

export function ReactionPicker({ currentReaction, onSelect, onRemove }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 rounded-2xl border border-border bg-bg-card px-3 py-2 shadow-xl"
    >
      {(Object.entries(REACTION_EMOJIS) as [ReactionType, { emoji: string; label: string; color: string }][]).map(
        ([type, { emoji, label }], i) => (
          <motion.button
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => (currentReaction === type ? onRemove() : onSelect(type))}
            title={label}
            className={`text-2xl leading-none transition-all ${currentReaction === type ? 'scale-125' : ''}`}
          >
            {emoji}
          </motion.button>
        )
      )}
    </motion.div>
  )
}
