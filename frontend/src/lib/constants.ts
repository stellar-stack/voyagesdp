import type { ReactionType } from '@/types'

export const REACTION_EMOJIS: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  LIKE: { emoji: '👍', label: 'Like', color: '#6366f1' },
  LOVE: { emoji: '❤️', label: 'Love', color: '#ef4444' },
  LAUGH: { emoji: '😂', label: 'Haha', color: '#f59e0b' },
  WOW: { emoji: '😮', label: 'Wow', color: '#8b5cf6' },
  SAD: { emoji: '😢', label: 'Sad', color: '#3b82f6' },
  ANGRY: { emoji: '😡', label: 'Angry', color: '#dc2626' },
}

export const FEED_PAGE_SIZE = 10
export const COMMENTS_PAGE_SIZE = 20
export const MESSAGES_PAGE_SIZE = 50
export const NOTIFICATIONS_PAGE_SIZE = 20
export const USERS_PAGE_SIZE = 20
