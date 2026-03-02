import { Link } from 'react-router-dom'
import { Flag, Users, Shield, ShieldCheck, AlertTriangle, UserX } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAdminStats } from '@/queries/moderation.queries'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const { data: stats, isLoading } = useAdminStats()

  const statCards = [
    {
      label: 'Pending Reports',
      value: stats?.pending_reports,
      icon: Flag,
      color: 'text-orange-500 bg-orange-500/10',
      urgent: (stats?.pending_reports ?? 0) > 0,
    },
    {
      label: 'Total Users',
      value: stats?.total_users,
      icon: Users,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Total Posts',
      value: stats?.total_posts,
      icon: ShieldCheck,
      color: 'text-accent bg-accent/10',
    },
    {
      label: 'AI Violations',
      value: stats?.active_violations,
      icon: Shield,
      color: 'text-yellow-500 bg-yellow-500/10',
      adminOnly: true,
    },
    {
      label: 'Suspended Users',
      value: stats?.suspended_users,
      icon: UserX,
      color: 'text-red-500 bg-red-500/10',
      adminOnly: true,
    },
  ]

  const navCards = [
    {
      to: '/admin/reports',
      icon: Flag,
      title: 'Reports',
      description: 'Review, resolve or act on user reports',
      color: 'text-orange-500 bg-orange-500/10',
      badge: stats?.pending_reports,
    },
    {
      to: '/admin/users',
      icon: Users,
      title: 'Users',
      description: 'Browse users, change roles, suspend accounts',
      color: 'text-blue-500 bg-blue-500/10',
      adminOnly: true,
    },
    {
      to: '/admin/violations',
      icon: Shield,
      title: 'AI Violations',
      description: 'Review AI moderation logs and false positives',
      color: 'text-yellow-500 bg-yellow-500/10',
      adminOnly: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-accent" size={28} />
        <div>
          <h1 className="text-xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-muted">Signed in as {user?.role}</p>
        </div>
      </div>

      {/* Live stats */}
      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3 px-1">Platform Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          {statCards.filter((c) => !c.adminOnly || isAdmin).map(({ label, value, icon: Icon, color, urgent }) => (
            <div
              key={label}
              className={cn('card p-4 flex items-center gap-3', urgent && 'ring-1 ring-orange-500/40')}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-6 w-10 mb-1" />
                ) : (
                  <p className="text-xl font-bold text-text-primary leading-none">
                    {value?.toLocaleString() ?? '—'}
                  </p>
                )}
                <p className="text-xs text-text-muted mt-0.5 truncate">{label}</p>
              </div>
              {urgent && (
                <AlertTriangle size={15} className="ml-auto text-orange-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3 px-1">Management</h2>
        <div className="grid gap-3">
          {navCards.filter((c) => !c.adminOnly || isAdmin).map(({ to, icon: Icon, title, description, color, badge }) => (
            <Link key={to} to={to} className="card-hover p-4 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary">{description}</p>
              </div>
              {(badge ?? 0) > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-medium text-white shrink-0">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
