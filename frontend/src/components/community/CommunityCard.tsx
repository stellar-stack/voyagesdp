import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useToggleJoin } from '@/queries/communities.queries'
import { formatCount } from '@/lib/utils'
import type { CommunityList } from '@/types'

interface CommunityCardProps {
  community: CommunityList
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { mutate: toggleJoin, isPending } = useToggleJoin(community.id)

  return (
    <div className="card-hover p-4 flex items-start gap-4">
      {/* Icon */}
      <div className="h-12 w-12 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
        <span className="text-accent font-bold text-lg">
          {community.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <Link to={`/communities/${community.id}`} className="hover:underline">
          <h3 className="font-semibold text-text-primary truncate">{community.name}</h3>
        </Link>
        <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{community.about}</p>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-text-muted">
          <Users size={12} />
          <span>{formatCount(community.members_count)} members</span>
        </div>
      </div>

      <button
        onClick={() => toggleJoin()}
        disabled={isPending}
        className={community.is_member ? 'btn-secondary text-sm shrink-0' : 'btn-primary text-sm shrink-0'}
      >
        {isPending ? '…' : community.is_member ? 'Leave' : 'Join'}
      </button>
    </div>
  )
}
