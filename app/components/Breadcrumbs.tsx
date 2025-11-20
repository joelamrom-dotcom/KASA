'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export default function Breadcrumbs({
  items,
  showHome = true,
  className = '',
}: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : items

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1

          return (
            <li key={index} className="flex items-center">
              {index === 0 && showHome && (
                <HomeIcon className="h-4 w-4 text-gray-400 mr-2" />
              )}
              {isLast ? (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {item.label}
                </span>
              ) : (
                <>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  )}
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

