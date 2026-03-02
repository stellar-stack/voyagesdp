export type NotifType =
  | 'REPORT_USER'
  | 'REPORT_ADMIN'
  | 'AI_VIOLATION'
  | 'SUSPENSION'
  | 'FOLLOW'
  | 'REACTION'
  | 'COMMENT'
  | 'MESSAGE'
  | 'SYSTEM'

export interface Notification {
  id: number
  notif_type: NotifType
  message: string
  is_read: boolean
  created_at: string
}

export interface WSNotification {
  notif_id: number
  notif_type: NotifType
  message: string
  is_read: boolean
  created_at: string
}
