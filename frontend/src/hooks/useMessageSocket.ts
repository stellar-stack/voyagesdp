import { useCallback } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/queries/queryClient'
import type { WSMessage, PaginatedResponse, Message } from '@/types'

export function useMessageSocket(conversationId: number | null) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const onMessage = useCallback(
    (raw: unknown) => {
      const msg = raw as WSMessage

      // Append new message to the messages cache without refetching
      queryClient.setQueryData(
        QUERY_KEYS.MESSAGES(msg.conversation_id),
        (old: InfiniteData<PaginatedResponse<Message>> | undefined) => {
          if (!old) return old
          const newMessage: Message = {
            id: msg.id,
            sender: msg.sender,
            content: msg.content,
            is_read: false,
            created_at: msg.created_at,
            is_deleted: false,
          }
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === old.pages.length - 1
                ? { ...page, results: [...page.results, newMessage] }
                : page
            ),
          }
        }
      )

      // Move conversation to top of list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATIONS })
    },
    [queryClient]
  )

  const { sendMessage } = useWebSocket({
    url: `/ws/messages/${conversationId}/`,
    enabled: !!user && !!conversationId,
    onMessage,
  })

  return { sendMessage }
}
