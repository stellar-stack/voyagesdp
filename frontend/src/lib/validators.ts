import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dob: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
})

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dob: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500).optional(),
})

export const createPostSchema = z.object({
  post_type: z.enum(['TEXT', 'IMAGE', 'VIDEO']),
  caption: z.string().max(255).optional(),
  content: z.string().optional(),
  community: z.number().optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
})

export const createCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  about: z.string().min(10, 'Tell us more about this community').max(1000),
  rules: z.string().optional(),
})

export const reportSchema = z.object({
  reason: z.string().min(10, 'Please describe the issue in more detail').max(500),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
export type ReportInput = z.infer<typeof reportSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
