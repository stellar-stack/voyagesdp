import type { UserPublic } from './auth'

export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW'
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO'

export interface Post {
  id: number
  user: UserPublic
  caption: string
  content: string
  image: string | null
  video: string | null
  post_type: PostType
  community: string | null
  reactions_count: number
  reactions_summary: Partial<Record<ReactionType, number>>
  comments_count: number
  shares_count: number
  user_reaction: ReactionType | null
  is_bookmarked: boolean
  created_at: string
}

export interface Comment {
  id: number
  user: UserPublic
  content: string
  parent: number | null
  replies: Reply[]
  reply_count: number
  created_at: string
}

export interface Reply {
  id: number
  user: UserPublic
  content: string
  created_at: string
}

export interface Bookmark {
  id: number
  post: Post
  created_at: string
}

export interface CreatePostPayload {
  post_type: PostType
  caption?: string
  content?: string
  community?: number
  image?: File
  video?: File
}

export interface CreateCommentPayload {
  post_id: number
  content: string
  parent?: number
}
