import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError?.response?.status === 401) return false
        if (axiosError?.response?.status === 403) return false
        if (axiosError?.response?.status === 404) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

export const QUERY_KEYS = {
  // Auth
  ME: ['auth', 'me'] as const,
  USER: (username: string) => ['users', username] as const,
  FOLLOWERS: (username: string) => ['users', username, 'followers'] as const,
  FOLLOWING: (username: string) => ['users', username, 'following'] as const,
  SEARCH: (q: string) => ['users', 'search', q] as const,

  // Posts
  FEED: ['posts', 'feed'] as const,
  USER_POSTS: (username: string) => ['posts', 'user', username] as const,
  COMMUNITY_FEED: (id: number) => ['posts', 'community', id] as const,
  POST: (id: number) => ['posts', id] as const,
  COMMENTS: (postId: number) => ['posts', postId, 'comments'] as const,
  BOOKMARKS: ['posts', 'bookmarks'] as const,

  // Communities
  COMMUNITIES: ['communities'] as const,
  COMMUNITY: (id: number) => ['communities', id] as const,
  MY_COMMUNITIES: ['communities', 'me'] as const,
  COMMUNITY_MEMBERS: (id: number) => ['communities', id, 'members'] as const,

  // Messages
  CONVERSATIONS: ['messages'] as const,
  MESSAGES: (convId: number) => ['messages', convId] as const,

  // Moderation
  NOTIFICATIONS: ['notifications'] as const,
  REPORTS: (status?: string) => ['reports', status ?? 'all'] as const,
  AI_VIOLATIONS: ['ai-violations'] as const,
} as const
