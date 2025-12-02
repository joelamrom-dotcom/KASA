'use client'

import Link from 'next/link'
import { usePrefetchOnHover } from '@/app/hooks/usePrefetch'

interface PrefetchLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  [key: string]: any
}

/**
 * Link component that prefetches on hover
 * Provides instant navigation
 */
export default function PrefetchLink({
  href,
  children,
  className = '',
  prefetch = true,
  ...props
}: PrefetchLinkProps) {
  const { handleMouseEnter, handleMouseLeave } = usePrefetchOnHover(href)

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={prefetch ? handleMouseEnter : undefined}
      onMouseLeave={prefetch ? handleMouseLeave : undefined}
      {...props}
    >
      {children}
    </Link>
  )
}

