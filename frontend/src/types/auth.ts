export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface UserPublic {
  id: number
  username: string
  first_name: string
  last_name: string
  profile_picture: string | null
  bio: string
  role: UserRole
  followers_count: number
  following_count: number
  is_following: boolean
}

export interface UserPrivate extends UserPublic {
  email: string
  gender: Gender | null
  dob: string | null
  country: string
  email_verified: boolean
  violation_count: number
  date_joined: string
  suspended_until: string | null
}

export interface UserAdmin extends UserPrivate {
  is_active: boolean
  is_deleted: boolean
  last_login: string | null
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
  gender?: Gender
  dob?: string
  country?: string
  bio?: string
  profile_picture?: File
}

export interface LoginPayload {
  username: string
  password: string
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  gender?: Gender
  dob?: string
  country?: string
  bio?: string
  profile_picture?: File
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
