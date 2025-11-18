'use client'

/**
 * Skeleton loaders for smooth content loading states
 */

export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
  )
}

export function ChartSkeleton({ className = 'h-96' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg ${className}`} />
  )
}

export function MapSkeleton({ className = 'h-64 md:h-96' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-gray-300 to-gray-200 animate-pulse rounded-lg ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading map...</div>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded animate-pulse ${i < lines - 1 ? 'mb-2' : ''} ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(count, 4)} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
        </div>
      ))}
    </div>
  )
}
