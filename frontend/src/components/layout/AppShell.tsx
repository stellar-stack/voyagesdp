import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNavBar from './MobileNavBar'
import { EditPostModal } from '@/components/post/EditPostModal'
import { CreatePostModal } from '@/components/post/CreatePostModal'
import { ReportModal } from '@/components/moderation/ReportModal'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg-secondary">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNavBar />

      {/* Global modals — rendered once for all protected pages */}
      <CreatePostModal />
      <EditPostModal />
      <ReportModal />
    </div>
  )
}
