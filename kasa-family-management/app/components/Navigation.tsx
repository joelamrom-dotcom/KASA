'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon,
  UserGroupIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { href: '/families', label: 'Families', icon: UserGroupIcon },
    { href: '/calculations', label: 'Calculations', icon: CalculatorIcon },
    { href: '/statements', label: 'Statements', icon: DocumentTextIcon },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

