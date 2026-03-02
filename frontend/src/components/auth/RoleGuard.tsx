import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  roles: UserRole[]
}

export default function RoleGuard({ roles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}
