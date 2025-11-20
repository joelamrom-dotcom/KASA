'use client'

interface SkeletonLoaderProps {
  type?: 'text' | 'avatar' | 'card' | 'table' | 'custom'
  lines?: number
  className?: string
  width?: string
  height?: string
}

export default function SkeletonLoader({
  type = 'text',
  lines = 3,
  className = '',
  width,
  height,
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'

  if (type === 'avatar') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    )
  }

  if (type === 'card') {
    return (
      <div className={`${baseClasses} p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`${baseClasses} h-4 flex-1`}></div>
            <div className={`${baseClasses} h-4 w-24`}></div>
            <div className={`${baseClasses} h-4 w-32`}></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'custom') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '100%', height: height || '20px' }}
      />
    )
  }

  // Default: text lines
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} h-4`}
          style={{
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  )
}

