import { useEffect, useRef, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  enabled?: boolean
  onMessage: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  enabled = true,
  onMessage,
  onOpen,
  onClose,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const attemptsRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef(enabled)
  const onMessageRef = useRef(onMessage)

  useEffect(() => { enabledRef.current = enabled }, [enabled])
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (!enabledRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    // Build full WS URL from relative path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const fullUrl = `${protocol}//${host}${url}`

    const ws = new WebSocket(fullUrl)
    wsRef.current = ws

    ws.onopen = () => {
      attemptsRef.current = 0
      onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string)
        onMessageRef.current(data)
      } catch {
        // Ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      onClose?.()
      if (!enabledRef.current) return
      if (attemptsRef.current >= maxReconnectAttempts) return

      const delay = reconnectDelay * Math.pow(2, attemptsRef.current)
      attemptsRef.current++
      timeoutRef.current = setTimeout(connect, Math.min(delay, 30_000))
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [url, maxReconnectAttempts, reconnectDelay, onOpen, onClose])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      wsRef.current?.close()
      wsRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    return () => {
      enabledRef.current = false
      wsRef.current?.close()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [enabled, connect])

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { sendMessage }
}
