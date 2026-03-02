import type { UserPublic } from './auth'

export interface Message {
  id: number
  conversation_id: number
  sender: UserPublic
  content: string
  is_read: boolean
  created_at: string
  is_deleted: boolean
}

export interface Conversation {
  id: number
  other_user: UserPublic
  last_message: Message | null
  unread_count: number
  updated_at: string
}

export interface WSMessage {
  id: number
  sender: UserPublic
  content: string
  created_at: string
  conversation_id: number
}
