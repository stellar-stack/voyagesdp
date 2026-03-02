import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/ui.store'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

// Layouts & Guards
import AppShell from '@/components/layout/AppShell'
import AuthGuard from '@/components/auth/AuthGuard'
import GuestGuard from '@/components/auth/GuestGuard'
import RoleGuard from '@/components/auth/RoleGuard'

// Pages
import LandingPage from '@/pages/landing/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage'
import FeedPage from '@/pages/feed/FeedPage'
import PostDetailPage from '@/pages/post/PostDetailPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import EditProfilePage from '@/pages/profile/EditProfilePage'
import FollowersPage from '@/pages/profile/FollowersPage'
import FollowingPage from '@/pages/profile/FollowingPage'
import CommunitiesPage from '@/pages/communities/CommunitiesPage'
import CommunityDetailPage from '@/pages/communities/CommunityDetailPage'
import CreateCommunityPage from '@/pages/communities/CreateCommunityPage'
import MessagesPage from '@/pages/messages/MessagesPage'
import ConversationPage from '@/pages/messages/ConversationPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import SearchPage from '@/pages/search/SearchPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminViolationsPage from '@/pages/admin/AdminViolationsPage'

function AppInner() {
  const { isLoading, isAuthenticated } = useAuth()

  // Connect to real-time notification WebSocket
  useNotificationSocket()

  // Sync system theme changes
  const setTheme = useUIStore((s) => s.setTheme)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, setTheme])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/oauth/callback/github" element={<OAuthCallbackPage />} />

      {/* Guest-only routes */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes — inside AppShell */}
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/followers" element={<FollowersPage />} />
          <Route path="/profile/:username/following" element={<FollowingPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/create" element={<CreateCommunityPage />} />
          <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<ConversationPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Admin routes */}
          <Route element={<RoleGuard roles={['ADMIN', 'MODERATOR']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/violations" element={<AdminViolationsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/feed' : '/'} replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatePresence mode="wait">
        <AppInner />
      </AnimatePresence>
    </BrowserRouter>
  )
}
