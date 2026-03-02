import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/api'
import { QUERY_KEYS } from './queryClient'

export function useConversationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.CONVERSATIONS,
    queryFn: () => messagesApi.listConversations(),
  })
}

export function useMessagesQuery(conversationId: number) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.MESSAGES(conversationId),
    queryFn: ({ pageParam = 1 }) => messagesApi.getMessages(conversationId, pageParam as number),
    getNextPageParam: (last) =>
      last.next ? Number(new URL(last.next).searchParams.get('page')) : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
    select: (data) => ({
      ...data,
      pages: [...data.pages].reverse(), // oldest first
    }),
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recipient, content }: { recipient: string; content: string }) =>
      messagesApi.sendMessage(recipient, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATIONS })
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: number) => messagesApi.deleteMessage(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATIONS })
    },
  })
}
