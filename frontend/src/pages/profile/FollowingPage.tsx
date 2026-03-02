import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useFollowing } from '@/queries/auth.queries'
import { UserCard } from '@/components/user/UserCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>()
  const { data, isLoading } = useFollowing(username!)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Following</h1>
      <div className="card divide-y divide-border">
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
        {!isLoading && (data?.results ?? []).length === 0 && (
          <EmptyState icon={Users} title="Not following anyone yet" />
        )}
        {(data?.results ?? []).map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
