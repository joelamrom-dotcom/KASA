'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon,
  UserGroupIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CalculatorIcon as CalculatorIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon, iconSolid: HomeIconSolid },
    { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
    { href: '/families', label: 'Families', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
    { href: '/calculations', label: 'Calculations', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
    { href: '/statements', label: 'Statements', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kasa</h1>
              <p className="text-xs text-gray-600">Family Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              ? item.iconSolid
              : item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 shadow-lg backdrop-blur-sm border border-white/30'
                    : 'text-gray-700 hover:bg-white/10 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-xs text-gray-600 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

