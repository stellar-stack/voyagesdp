import type { UserPublic } from './auth'

export interface CommunityList {
  id: number
  name: string
  about: string
  created_by: string
  members_count: number
  is_member: boolean
  created_at: string
}

export interface Community {
  id: number
  name: string
  about: string
  rules: string
  banner: string | null
  created_by: string
  members_count: number
  moderators: UserPublic[]
  is_member: boolean
  created_at: string
}

export interface CreateCommunityPayload {
  name: string
  about: string
  rules?: string
  banner?: File
}

export interface UpdateCommunityPayload {
  name?: string
  about?: string
  rules?: string
  banner?: File
}
