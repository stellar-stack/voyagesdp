import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Search } from 'lucide-react'
import { useConversationsQuery, useSendMessage } from '@/queries/messages.queries'
import { useSearchUsers } from '@/queries/auth.queries'
import { useDebounce } from '@/hooks/useDebounce'
import { UserAvatar } from '@/components/user/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatDate } from '@/lib/utils'

export default function MessagesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useConversationsQuery()
  const { mutate: sendMessage } = useSendMessage()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const { data: searchResults } = useSearchUsers(debouncedSearch)

  const conversations = data?.results ?? []

  const startConversation = (username: string) => {
    sendMessage(
      { recipient: username, content: '👋' },
      {
        onSuccess: (data) => {
          setSearch('')
          navigate(`/messages/${data.conversation_id}`)
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Messages</h1>

      {/* Search to start new convo */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Start a conversation…"
          className="input-base pl-9 text-sm"
        />
      </div>

      {/* Search results */}
      {search.length >= 2 && (searchResults ?? []).length > 0 && (
        <div className="card divide-y divide-border">
          {(searchResults ?? []).slice(0, 5).map((user) => (
            <button
              key={user.id}
              onClick={() => startConversation(user.username)}
              className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
            >
              <UserAvatar user={user} size="md" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-text-muted">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div className="card divide-y divide-border overflow-hidden">
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-11 w-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}

        {!isLoading && conversations.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Search for someone to start chatting"
          />
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => navigate(`/messages/${conv.id}`)}
            className="w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors text-left"
          >
            <UserAvatar user={conv.other_user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={cn('text-sm font-medium truncate', conv.unread_count > 0 ? 'text-text-primary' : 'text-text-secondary')}>
                  {conv.other_user.first_name} {conv.other_user.last_name}
                </p>
                <span className="text-xs text-text-muted shrink-0 ml-2">
                  {conv.last_message ? formatDate(conv.last_message.created_at) : ''}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-text-muted truncate">
                  {conv.last_message
                    ? conv.last_message.is_deleted
                      ? 'Message deleted'
                      : conv.last_message.content
                    : 'No messages yet'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-white shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
