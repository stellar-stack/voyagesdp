import type { UserPublic } from './auth'
import type { Post } from './post'

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED'
export type ViolationAction = 'WARNED' | 'SUSPENDED_7' | 'SUSPENDED_30' | 'BANNED'
export type ContentType = 'POST' | 'COMMENT'

export interface Report {
  id: number
  post: Post
  reported_by: UserPublic
  reported_user: UserPublic
  reason: string
  status: ReportStatus
  resolved_by: UserPublic | null
  resolved_at: string | null
  created_at: string
}

export interface AIViolationLog {
  id: number
  user: UserPublic
  content_type: ContentType
  content_id: number
  content_text: string
  reason: string
  flagged_at: string
  action_taken: ViolationAction
  violation_number: number
  is_false_positive: boolean
  reviewed_by: UserPublic | null
}

export interface CreateReportPayload {
  post: number
  reason: string
}
