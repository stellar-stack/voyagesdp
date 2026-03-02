import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { postsApi } from '@/api'
import { QUERY_KEYS } from './queryClient'
import type { Post, CreatePostPayload, ReactionType, PaginatedResponse } from '@/types'

export function usePostQuery(postId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.POST(postId),
    queryFn: () => postsApi.getPost(postId),
    enabled: !!postId,
  })
}

export function useFeedQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.FEED,
    queryFn: ({ pageParam = 1 }) => postsApi.getFeed(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useUserPostsQuery(username: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.USER_POSTS(username),
    queryFn: ({ pageParam = 1 }) => postsApi.getUserPosts(username, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
    enabled: !!username,
  })
}

export function useCommunityFeedQuery(communityId: number) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.COMMUNITY_FEED(communityId),
    queryFn: ({ pageParam = 1 }) => postsApi.getCommunityFeed(communityId, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useCommentsQuery(postId: number) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.COMMENTS(postId),
    queryFn: ({ pageParam = 1 }) => postsApi.getComments(postId, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useBookmarksQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.BOOKMARKS,
    queryFn: ({ pageParam = 1 }) => postsApi.getBookmarks(pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
  })
}

export function useCreatePost(communityId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      postsApi.createPost({ ...payload, community: communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED })
      if (communityId) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMUNITY_FEED(communityId) })
      }
    },
  })
}

export function useEditPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: { caption?: string; content?: string } }) =>
      postsApi.editPost(postId, payload),
    onSuccess: (_data: Post, { postId }: { postId: number; payload: { caption?: string; content?: string } }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId) })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => postsApi.deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED })
    },
  })
}

export function useToggleReaction(postId: number) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (reactionType: ReactionType | null) =>
      postsApi.toggleReaction(postId, reactionType),

    onMutate: async (newReaction) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      const previousFeed = qc.getQueryData(QUERY_KEYS.FEED)

      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((post) => {
                if (post.id !== postId) return post
                const prevReaction = post.user_reaction
                const prevCount = post.reactions_count
                const prevSummary = { ...post.reactions_summary }

                // Remove old reaction count
                if (prevReaction && prevSummary[prevReaction]) {
                  prevSummary[prevReaction] = (prevSummary[prevReaction] ?? 1) - 1
                  if (prevSummary[prevReaction] === 0) delete prevSummary[prevReaction]
                }

                // Add new reaction count
                if (newReaction) {
                  prevSummary[newReaction] = (prevSummary[newReaction] ?? 0) + 1
                }

                const countDelta =
                  prevReaction && !newReaction
                    ? -1
                    : !prevReaction && newReaction
                      ? 1
                      : 0

                return {
                  ...post,
                  user_reaction: newReaction,
                  reactions_count: prevCount + countDelta,
                  reactions_summary: prevSummary,
                }
              }),
            })),
          }
        }
      )

      return { previousFeed }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(QUERY_KEYS.FEED, context.previousFeed)
      }
    },

    onSettled: () => {
      // Mark stale without forcing an immediate network request —
      // the optimistic update is already applied and correct.
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
    },
  })
}

export function useToggleBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => postsApi.toggleBookmark(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.FEED })
      const prevFeed = qc.getQueryData(QUERY_KEYS.FEED)
      const prevPost = qc.getQueryData<Post>(QUERY_KEYS.POST(postId))

      const flipPost = (post: Post) =>
        post.id === postId ? { ...post, is_bookmarked: !post.is_bookmarked } : post

      qc.setQueryData(
        QUERY_KEYS.FEED,
        (old: InfiniteData<PaginatedResponse<Post>> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map(flipPost),
            })),
          }
        }
      )

      if (prevPost) {
        qc.setQueryData<Post>(QUERY_KEYS.POST(postId), {
          ...prevPost,
          is_bookmarked: !prevPost.is_bookmarked,
        })
      }

      return { prevFeed, prevPost }
    },
    onError: (_err, postId, context) => {
      if (context?.prevFeed) qc.setQueryData(QUERY_KEYS.FEED, context.prevFeed)
      if (context?.prevPost) qc.setQueryData(QUERY_KEYS.POST(postId), context.prevPost)
    },
    onSettled: (_data, _err, postId) => {
      // Mark stale without forcing an immediate refetch on FEED/POST.
      // Bookmarks list needs a real refetch since its structure differs (Bookmark, not Post).
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POST(postId), refetchType: 'none' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postsApi.addComment,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(variables.post_id) })
      // Feed only needs to know comments_count changed — mark stale, don't force refetch
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FEED, refetchType: 'none' })
    },
  })
}
