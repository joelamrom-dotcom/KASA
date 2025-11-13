'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function FloatingKasaButton() {
  const pathname = usePathname()
  const isOnKasaProjectionPage = pathname === '/analysis/kasa-projection'

  // Hide the button when already on the Kasa Projection page
  if (isOnKasaProjectionPage) {
    return null
  }

  return (
    <Link
      href="/analysis/kasa-projection"
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-50 flex items-center justify-center"
      aria-label="Open Kasa Projection"
    >
      <ChartBarIcon className="h-6 w-6" />
    </Link>
  )
}

