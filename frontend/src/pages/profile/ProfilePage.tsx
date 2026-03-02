import { useParams, Link } from 'react-router-dom'
import { MapPin, Calendar, Edit } from 'lucide-react'
import { useUserProfile } from '@/queries/auth.queries'
import { useUserPostsQuery } from '@/queries/posts.queries'
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
        <div className="h-24 bg-gradient-to-br from-accent/40 to-purple-500/20" />

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                {profile.first_name} {profile.last_name}
              </h1>
              {profile.role !== 'USER' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-muted text-accent">
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-secondary text-sm mb-3">{profile.bio}</p>
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
          <div className="flex gap-5 text-sm">
            <Link
              to={`/profile/${username}/followers`}
              className="hover:underline flex items-center gap-1"
            >
              <span className="font-bold text-text-primary">
                {formatCount(profile.followers_count)}
              </span>
              <span className="text-text-muted">Followers</span>
            </Link>
            <Link
              to={`/profile/${username}/following`}
              className="hover:underline flex items-center gap-1"
            >
              <span className="font-bold text-text-primary">
                {formatCount(profile.following_count)}
              </span>
              <span className="text-text-muted">Following</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="font-semibold text-text-primary px-1">Posts</h2>

      {postsLoading && <div className="space-y-4">{[1, 2].map((i) => <PostSkeleton key={i} />)}</div>}

      <div className="space-y-4">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <PostSkeleton />}
    </div>
  )
}
