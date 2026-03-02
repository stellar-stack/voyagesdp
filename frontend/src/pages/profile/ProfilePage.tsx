import { useParams, Link } from 'react-router-dom'
import { MapPin, Calendar, Edit, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

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
import { useUserProfile } from '@/queries/auth.queries'
import { useUserPostsQuery } from '@/queries/posts.queries'
import { useUserCommunities } from '@/queries/communities.queries'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useAuthStore } from '@/store/auth.store'
import { UserAvatar } from '@/components/user/UserAvatar'
import { FollowButton } from '@/components/user/FollowButton'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCount } from '@/lib/utils'
import { format } from 'date-fns'
import type { UserPrivate } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const { data: profile, isLoading: profileLoading } = useUserProfile(username!)
  const { data: postsData, isLoading: postsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserPostsQuery(username!)
  const { data: userCommunities } = useUserCommunities(username!)
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, !!hasNextPage)

  const isOwnProfile = currentUser?.username === username
  const posts = postsData?.pages.flatMap((p) => p.results) ?? []

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <div className="card p-6 space-y-4">
          <div className="h-24 rounded-xl bg-border/50" />
          <div className="flex items-end gap-4 -mt-10 px-2">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2 pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return <div className="text-center text-text-muted py-16">User not found</div>

  const priv = profile as UserPrivate

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-accent/50 via-violet-500/20 to-purple-500/10" />

        <div className="px-5 pb-5">
          {/* Avatar + actions */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <UserAvatar user={profile} size="xl" className="border-4 border-bg-card" />
            <div className="flex gap-2 mt-10">
              {isOwnProfile ? (
                <Link to="/profile/edit" className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Edit size={14} /> Edit Profile
                </Link>
              ) : (
                <FollowButton
                  username={profile.username}
                  isFollowing={profile.is_following ?? false}
                  currentUsername={currentUser?.username}
                />
              )}
            </div>
          </div>

          {/* Name + role */}
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {profile.first_name} {profile.last_name}
              </h1>
              {profile.role !== 'USER' && (
                <span className="chip-accent">{profile.role}</span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-0.5">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-secondary text-sm mb-4 leading-[1.7]">{profile.bio}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-4">
            {priv.country && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {priv.country}
              </span>
            )}
            {priv.date_joined && (
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Joined {format(new Date(priv.date_joined), 'MMMM yyyy')}
              </span>
            )}
          </div>

          {/* Follow counts */}
          <div className="flex items-center gap-6">
            <Link
              to={`/profile/${username}/followers`}
              className="text-center hover:text-accent transition-colors"
            >
              <p className="text-lg font-bold text-text-primary">{formatCount(profile.followers_count)}</p>
              <p className="text-xs text-text-muted">Followers</p>
            </Link>
            <div className="h-8 w-px bg-border" />
            <Link
              to={`/profile/${username}/following`}
              className="text-center hover:text-accent transition-colors"
            >
              <p className="text-lg font-bold text-text-primary">{formatCount(profile.following_count)}</p>
              <p className="text-xs text-text-muted">Following</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Enrolled Communities */}
      {userCommunities && userCommunities.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-accent" />
            <h2 className="font-semibold text-text-primary text-sm">
              {isOwnProfile ? 'My Communities' : 'Communities'}
            </h2>
            <span className="chip-muted">{userCommunities.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userCommunities.map((community) => (
              <Link
                key={community.id}
                to={`/communities/${community.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-surface-hover transition-colors text-sm text-text-secondary hover:text-text-primary"
              >
                <div className={cn(
                  'h-5 w-5 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm',
                  getCommunityGradient(community.name)
                )}>
                  <span className="text-white text-[10px] font-bold leading-none">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate max-w-[120px] font-medium">{community.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <h2 className="font-semibold text-text-primary px-1 tracking-tight">Posts</h2>

      {postsLoading && <div className="space-y-4">{[1, 2].map((i) => <PostSkeleton key={i} />)}</div>}

      <div className="space-y-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <PostSkeleton />}
    </div>
  )
}
