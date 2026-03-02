import { create } from 'zustand'

interface MessageState {
  totalUnread: number
  conversationUnreads: Record<number, number>
  setTotalUnread: (count: number) => void
  setConversationUnread: (convId: number, count: number) => void
  clearConversationUnread: (convId: number) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  totalUnread: 0,
  conversationUnreads: {},

  setTotalUnread: (totalUnread) => set({ totalUnread }),

  setConversationUnread: (convId, count) =>
    set((s) => {
      const prev = s.conversationUnreads[convId] ?? 0
      const diff = count - prev
      return {
        conversationUnreads: { ...s.conversationUnreads, [convId]: count },
        totalUnread: Math.max(0, s.totalUnread + diff),
      }
    }),

  clearConversationUnread: (convId) =>
    set((s) => {
      const prev = s.conversationUnreads[convId] ?? 0
      return {
        conversationUnreads: { ...s.conversationUnreads, [convId]: 0 },
        totalUnread: Math.max(0, s.totalUnread - prev),
      }
    }),
}))
