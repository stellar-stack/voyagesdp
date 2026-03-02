import { NavLink } from 'react-router-dom'
import { Home, Users, MessageCircle, Bell, Search } from 'lucide-react'
import { useNotificationStore } from '@/store/notification.store'
import { useMessageStore } from '@/store/message.store'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/feed', icon: Home },
  { to: '/communities', icon: Users },
  { to: '/search', icon: Search },
  { to: '/messages', icon: MessageCircle, badge: 'messages' },
  { to: '/notifications', icon: Bell, badge: 'notifications' },
]

export default function MobileNavBar() {
  const unreadNotifs = useNotificationStore((s) => s.unreadCount)
  const unreadMessages = useMessageStore((s) => s.totalUnread)

  const getBadge = (badge?: string) => {
    if (badge === 'notifications') return unreadNotifs
    if (badge === 'messages') return unreadMessages
    return 0
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/50 bg-bg-primary/90 backdrop-blur-xl px-2 py-2 lg:hidden">
      {navItems.map(({ to, icon: Icon, badge }) => {
        const count = getBadge(badge)
        return (
          <NavLink
            key={to}
            to={to}
            className="relative flex flex-col items-center justify-center p-1 rounded-2xl"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'p-2.5 rounded-2xl transition-all duration-200',
                  isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                )}>
                  <Icon size={21} />
                </div>
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-white">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
