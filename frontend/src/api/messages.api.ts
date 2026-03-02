import { api } from './axios'
import type { Conversation, Message, PaginatedResponse } from '@/types'

export const messagesApi = {
  listConversations: async (page = 1) => {
    const res = await api.get<PaginatedResponse<Conversation>>(`/messages/?page=${page}`)
    return res.data
  },

  sendMessage: async (recipientUsername: string, content: string) => {
    const res = await api.post<Message>('/messages/send/', {
      username: recipientUsername,
      content,
    })
    return res.data
  },

  getMessages: async (conversationId: number, page = 1) => {
    const res = await api.get<PaginatedResponse<Message>>(
      `/messages/${conversationId}/messages/?page=${page}`
    )
    return res.data
  },

  deleteMessage: async (messageId: number) => {
    await api.delete(`/messages/messages/${messageId}/delete/`)
  },
}
