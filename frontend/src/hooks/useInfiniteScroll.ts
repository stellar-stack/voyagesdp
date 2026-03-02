import { useEffect, useRef } from 'react'

export function useInfiniteScroll(onLoadMore: () => void, hasNextPage: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore, hasNextPage])

  return sentinelRef
}
