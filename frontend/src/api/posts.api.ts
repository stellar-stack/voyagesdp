import { api, buildFormData } from './axios'
import type { Post, Comment, Bookmark, CreatePostPayload, CreateCommentPayload, ReactionType, PaginatedResponse } from '@/types'

export const postsApi = {
  getPost: async (postId: number) => {
    const res = await api.get<Post>(`/posts/${postId}/`)
    return res.data
  },

  getUserPosts: async (username: string, page = 1) => {
    const res = await api.get<PaginatedResponse<Post>>(`/posts/user/${username}/?page=${page}`)
    return res.data
  },

  getFeed: async (page = 1) => {
    const res = await api.get<PaginatedResponse<Post>>(`/posts/feed/?page=${page}`)
    return res.data
  },

  getCommunityFeed: async (communityId: number, page = 1) => {
    const res = await api.get<PaginatedResponse<Post>>(
      `/posts/community/${communityId}/?page=${page}`
    )
    return res.data
  },

  createPost: async (payload: CreatePostPayload) => {
    const form = buildFormData(payload as unknown as Record<string, unknown>)
    const res = await api.post<Post>('/posts/create/', form)
    return res.data
  },

  editPost: async (postId: number, payload: { caption?: string; content?: string }) => {
    const res = await api.patch<Post>(`/posts/${postId}/edit/`, payload)
    return res.data
  },

  deletePost: async (postId: number) => {
    await api.delete(`/posts/${postId}/delete/`)
  },

  toggleReaction: async (postId: number, reactionType: ReactionType | null) => {
    const res = await api.post<{ reacted: boolean; reaction_type: ReactionType | null }>(
      '/posts/react/',
      { post_id: postId, reaction_type: reactionType }
    )
    return res.data
  },

  sharePost: async (postId: number) => {
    const res = await api.post('/posts/share/', { post_id: postId })
    return res.data
  },

  addComment: async (payload: CreateCommentPayload) => {
    const res = await api.post<Comment>('/posts/comment/', payload)
    return res.data
  },

  getComments: async (postId: number, page = 1) => {
    const res = await api.get<PaginatedResponse<Comment>>(
      `/posts/${postId}/comments/?page=${page}`
    )
    return res.data
  },

  toggleBookmark: async (postId: number) => {
    const res = await api.post<{ bookmarked: boolean }>(`/posts/${postId}/bookmark/`)
    return res.data
  },

  getBookmarks: async (page = 1) => {
    const res = await api.get<PaginatedResponse<Bookmark>>(`/posts/bookmarks/?page=${page}`)
    return res.data
  },
}
