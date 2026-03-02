import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { QUERY_KEYS } from '@/queries/queryClient'
import type { WSNotification, Notification } from '@/types'

export function useNotificationSocket() {
  const user = useAuthStore((s) => s.user)
  const { incrementUnread, addNotification } = useNotificationStore()
  const queryClient = useQueryClient()

  const onMessage = useCallback(
    (raw: unknown) => {
      const data = raw as WSNotification

      const notification: Notification = {
        id: data.notif_id,
        notif_type: data.notif_type,
        message: data.message,
        is_read: data.is_read,
        created_at: data.created_at,
      }

      incrementUnread()
      addNotification(notification)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })

      const showToastFor = ['FOLLOW', 'COMMENT', 'REACTION', 'MESSAGE']
      if (showToastFor.includes(data.notif_type)) {
        toast(data.message, { duration: 4000 })
      }
    },
    [incrementUnread, addNotification, queryClient]
  )

  useWebSocket({
    url: '/ws/notifications/',
    enabled: !!user,
    onMessage,
  })
}
