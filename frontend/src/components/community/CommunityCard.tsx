import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useToggleJoin } from '@/queries/communities.queries'
import { cn, formatCount } from '@/lib/utils'
import type { CommunityList } from '@/types'

interface CommunityCardProps {
  community: CommunityList
}

const communityColors = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
]

function getCommunityGradient(name: string) {
  return communityColors[name.charCodeAt(0) % communityColors.length]
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { mutate: toggleJoin, isPending } = useToggleJoin(community.id)

  return (
    <div className="card-hover p-4 flex items-center gap-4">
      {/* Icon — colored gradient */}
      <div className={cn(
        'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm',
        getCommunityGradient(community.name)
      )}>
        <span className="text-white font-bold text-lg">
          {community.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <Link to={`/communities/${community.id}`} className="hover:text-accent transition-colors">
          <h3 className="font-semibold text-text-primary truncate">{community.name}</h3>
        </Link>
        <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{community.about}</p>
        <span className="chip-muted mt-1.5 inline-flex">
          <Users size={10} />
          {formatCount(community.members_count)} members
        </span>
      </div>

      <button
        onClick={() => toggleJoin()}
        disabled={isPending}
        className={cn(
          'text-sm shrink-0 min-w-[72px]',
          community.is_member ? 'btn-secondary' : 'btn-primary'
        )}
      >
        {isPending ? '…' : community.is_member ? 'Leave' : 'Join'}
      </button>
    </div>
  )
}
