import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { useConversationsQuery, useMessagesQuery, useDeleteMessage } from '@/queries/messages.queries'
import { useMessageSocket } from '@/hooks/useMessageSocket'
import { useAuthStore } from '@/store/auth.store'
import { useMessageStore } from '@/store/message.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatMessageTime } from '@/lib/utils'

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const convId = Number(conversationId)
  const currentUser = useAuthStore((s) => s.user)
  const { clearConversationUnread } = useMessageStore()

  const { data: convData } = useConversationsQuery()
  const conversation = convData?.results.find((c) => c.id === convId)

  const { data, isLoading, fetchNextPage, hasNextPage } = useMessagesQuery(convId)
  const { mutate: deleteMessage } = useDeleteMessage()
  const { sendMessage } = useMessageSocket(convId)

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = data?.pages.flatMap((p) => p.results) ?? []

  // Clear unread on mount/unmount
  useEffect(() => {
    clearConversationUnread(convId)
    return () => clearConversationUnread(convId)
  }, [convId, clearConversationUnread])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage({ content: text })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link to="/messages" className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
          <ArrowLeft size={18} />
        </Link>
        {conversation ? (
          <>
            <UserAvatar user={conversation.other_user} size="md" />
            <div>
              <p className="font-semibold text-text-primary text-sm">
                {conversation.other_user.first_name} {conversation.other_user.last_name}
              </p>
              <p className="text-xs text-text-muted">@{conversation.other_user.username}</p>
            </div>
          </>
        ) : (
          <Skeleton className="h-10 w-40" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full text-xs text-text-muted text-center py-2 hover:text-accent"
          >
            Load older messages
          </button>
        )}

        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : '')}>
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>
        ))}

        {messages.map((msg) => {
          const isOwn = msg.sender.id === currentUser?.id
          return (
            <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : '')}>
              {!isOwn && <UserAvatar user={msg.sender} size="sm" className="mt-auto" />}
              <div className={cn('group flex flex-col gap-1 max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'px-3.5 py-2.5 rounded-2xl text-sm',
                    isOwn
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-bg-secondary text-text-primary rounded-bl-sm',
                    msg.is_deleted && 'opacity-50 italic'
                  )}
                >
                  {msg.is_deleted ? 'Message deleted' : msg.content}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-text-muted">
                    {formatMessageTime(msg.created_at)}
                  </span>
                  {isOwn && !msg.is_deleted && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-border flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="input-base flex-1 resize-none text-sm"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = `${Math.min(t.scrollHeight, 120)}px`
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="btn-primary p-2.5 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
