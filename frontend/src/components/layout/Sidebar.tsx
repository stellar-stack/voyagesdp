import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Users, MessageCircle, Bell, Bookmark, Search,
  LogOut, Sun, Moon, Monitor, ShieldCheck, ChevronDown, ChevronUp, PenSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNotificationStore } from '@/store/notification.store'
import { useMessageStore } from '@/store/message.store'
import { useLogout } from '@/queries/auth.queries'
import { useMyCommunities } from '@/queries/communities.queries'
import { cn, getInitials, getMediaUrl } from '@/lib/utils'

const navLinks = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/communities', icon: Users, label: 'Communities' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/search', icon: Search, label: 'Search' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme, openModal } = useUIStore()
  const unreadNotifs = useNotificationStore((s) => s.unreadCount)
  const unreadMessages = useMessageStore((s) => s.totalUnread)
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  const [communitiesOpen, setCommunitiesOpen] = useState(true)

  const { data: myCommunities } = useMyCommunities()

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
  }

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-border bg-bg-primary px-4 py-6 lg:flex">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="text-xl font-bold text-text-primary">Voyage</span>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {/* Navigation */}
        <nav className="space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('sidebar-link relative', isActive && 'active')
              }
            >
              <Icon size={20} />
              <span>{label}</span>

              {/* Unread badge */}
              {label === 'Notifications' && unreadNotifs > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-white"
                >
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </motion.span>
              )}
              {label === 'Messages' && unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-white"
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </motion.span>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              <ShieldCheck size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        {/* Enrolled Communities */}
        {myCommunities && myCommunities.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setCommunitiesOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide hover:text-text-primary transition-colors"
            >
              <span>My Communities</span>
              {communitiesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <AnimatePresence initial={false}>
              {communitiesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 space-y-0.5">
                    {myCommunities.slice(0, 8).map((community) => (
                      <Link
                        key={community.id}
                        to={`/communities/${community.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors truncate"
                      >
                        <div className="h-5 w-5 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                          <span className="text-accent text-xs font-bold">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate">{community.name}</span>
                      </Link>
                    ))}
                    {myCommunities.length > 8 && (
                      <Link
                        to="/communities"
                        className="flex items-center px-3 py-1.5 text-xs text-text-muted hover:text-accent transition-colors"
                      >
                        +{myCommunities.length - 8} more
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="space-y-2 pt-4 border-t border-border">
        {/* Create post button */}
        <button
          onClick={() => openModal('create-post')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <PenSquare size={16} />
          New Post
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="btn-ghost w-full flex items-center gap-3 justify-start"
        >
          <ThemeIcon size={18} />
          <span className="capitalize">{theme} theme</span>
        </button>

        {/* User profile */}
        <NavLink
          to={`/profile/${user?.username}`}
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-hover transition-colors"
        >
          {user?.profile_picture ? (
            <img
              src={getMediaUrl(user.profile_picture)!}
              alt={user.username}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-accent-muted flex items-center justify-center">
              <span className="text-accent text-sm font-semibold">
                {getInitials(user?.first_name ?? '', user?.last_name ?? '')}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-text-muted truncate">@{user?.username}</p>
          </div>
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="btn-ghost w-full flex items-center gap-3 justify-start text-danger hover:bg-danger/10"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
