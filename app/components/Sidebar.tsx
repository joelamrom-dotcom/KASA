'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUser, logout, setAuth } from '@/lib/auth'
import { ArrowRightOnRectangleIcon, UserCircleIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import { 
  HomeIcon,
  UserGroupIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CalendarIcon,
  CogIcon,
  PresentationChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CalculatorIcon as CalculatorIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  CalendarIcon as CalendarIconSolid,
  CogIcon as CogIconSolid,
  PresentationChartBarIcon as PresentationChartBarIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartPieIcon as ChartPieIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
  TrashIcon as TrashIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid'

export default function Sidebar() {
  const pathname = usePathname()
  const user = getUser()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

    const navItems = [
      { href: '/', label: 'Dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
      { href: '/families', label: 'Families', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
      { href: '/payments', label: 'Payments', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
      { href: '/tasks', label: 'Tasks', icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
      { href: '/calculations', label: 'Calculations', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
      { href: '/events', label: 'Events', icon: CalendarIcon, iconSolid: CalendarIconSolid },
      { href: '/reports', label: 'Reports', icon: PresentationChartBarIcon, iconSolid: PresentationChartBarIconSolid },
      { href: '/statements', label: 'Statements', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
      { href: '/import', label: 'Import', icon: ArrowUpTrayIcon, iconSolid: ArrowUpTrayIconSolid },
      { href: '/recycle-bin', label: 'Recycle Bin', icon: TrashIcon, iconSolid: TrashIconSolid },
      { href: '/settings', label: 'Settings', icon: CogIcon, iconSolid: CogIconSolid },
      // Show Users page only for super_admin
      ...(user?.role === 'super_admin' ? [{ href: '/users', label: 'Users', icon: UsersIcon, iconSolid: UsersIconSolid }] : []),
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
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-white/10 hover:text-gray-900 group"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/30">
                  <UserCircleIcon className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-xl shadow-xl border border-white/30 backdrop-blur-xl overflow-hidden">
                  <div className="p-4 border-b border-white/20">
                    <p className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-600 mt-1">{user.email}</p>
                    {user.role && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-700 rounded border border-blue-300/50 capitalize">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/auth/refresh-user', { method: 'POST' })
                        if (res.ok) {
                          const data = await res.json()
                          console.log('Refreshed user:', data.user)
                          setAuth(data.token, data.user)
                          setShowUserMenu(false)
                          window.location.reload()
                        } else {
                          const errorData = await res.json()
                          console.error('Failed to refresh user:', errorData)
                          alert('Failed to refresh session. Please log out and log back in.')
                        }
                      } catch (error) {
                        console.error('Failed to refresh user:', error)
                        alert('Failed to refresh session. Please log out and log back in.')
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                  >
                    <ArrowPathIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                    <span className="font-medium">Refresh Session</span>
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500 group-hover:text-red-600" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

