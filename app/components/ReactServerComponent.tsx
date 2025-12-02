/**
 * React Server Component wrapper
 * Use this for components that can be rendered on the server
 * Reduces client-side JavaScript bundle size
 */

import { Suspense } from 'react'

interface ServerComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Server Component wrapper with Suspense
 */
export default function ReactServerComponent({
  children,
  fallback = <div>Loading...</div>,
}: ServerComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

