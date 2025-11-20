'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUser, logout, setAuth } from '@/lib/auth'
import PushNotificationManager from './PushNotificationManager'
import GlobalSearch from './GlobalSearch'
import NotificationCenter from './NotificationCenter'
import DarkModeToggle from './DarkModeToggle'
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
  ArrowDownTrayIcon,
  TrashIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  TagIcon,
  LinkIcon,
  DocumentChartBarIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
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
  ArrowDownTrayIcon as ArrowDownTrayIconSolid,
  TrashIcon as TrashIconSolid,
  UsersIcon as UsersIconSolid,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  TagIcon as TagIconSolid,
  LinkIcon as LinkIconSolid,
  DocumentChartBarIcon as DocumentChartBarIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  ComputerDesktopIcon as ComputerDesktopIconSolid
} from '@heroicons/react/24/solid'

export default function Sidebar() {
  const pathname = usePathname()
  const user = getUser()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Note: DB fallback in API routes handles access for joelamrom@gmail.com
  // No need to refresh session - API routes check DB directly

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
      ...(user?.role === 'family' ? [
        { href: '/portal', label: 'My Portal', icon: Squares2X2Icon, iconSolid: Squares2X2IconSolid }
      ] : [
        { href: '/families', label: 'Families', icon: UserGroupIcon, iconSolid: UserGroupIconSolid }
      ]),
      { href: '/payments', label: 'Payments', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
      ...(user?.role === 'admin' || user?.role === 'super_admin' ? [
        { href: '/overdue-payments', label: 'Overdue Payments', icon: ExclamationTriangleIcon, iconSolid: ExclamationTriangleIconSolid }
      ] : []),
      { href: '/tasks', label: 'Tasks', icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
      { href: '/calendar', label: 'Calendar', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
      { href: '/calculations', label: 'Calculations', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
      { href: '/events', label: 'Events', icon: CalendarIcon, iconSolid: CalendarIconSolid },
      { href: '/reports', label: 'Reports', icon: PresentationChartBarIcon, iconSolid: PresentationChartBarIconSolid },
      { href: '/reports/custom', label: 'Custom Reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
      { href: '/statements', label: 'Statements', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
      { href: '/import', label: 'Import', icon: ArrowUpTrayIcon, iconSolid: ArrowUpTrayIconSolid },
      { href: '/recycle-bin', label: 'Recycle Bin', icon: TrashIcon, iconSolid: TrashIconSolid },
      ...(user?.role === 'admin' || user?.role === 'super_admin' ? [
        { href: '/family-tags', label: 'Family Tags', icon: TagIcon, iconSolid: TagIconSolid },
        { href: '/family-groups', label: 'Family Groups', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
        { href: '/payment-links', label: 'Payment Links', icon: LinkIcon, iconSolid: LinkIconSolid },
        { href: '/payment-analytics', label: 'Payment Analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
        { href: '/backup', label: 'Backup & Restore', icon: ArrowDownTrayIcon, iconSolid: ArrowDownTrayIconSolid }
      ] : []),
      { href: '/documents', label: 'Documents', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
      { href: '/communication', label: 'Communication', icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleLeftRightIconSolid },
      { href: '/settings', label: 'Settings', icon: CogIcon, iconSolid: CogIconSolid },
      ...(user?.role === 'super_admin' || user?.role === 'admin' ? [
        { href: '/roles', label: 'Roles & Permissions', icon: ShieldCheckIcon, iconSolid: ShieldCheckIconSolid },
        { href: '/sessions', label: 'Sessions', icon: ComputerDesktopIcon, iconSolid: ComputerDesktopIconSolid }
      ] : []),
      ...(user?.role === 'super_admin' ? [
        { href: '/users', label: 'Users', icon: UsersIcon, iconSolid: UsersIconSolid },
        { href: '/audit-logs', label: 'Audit Logs', icon: ClipboardDocumentCheckIcon, iconSolid: ClipboardDocumentCheckIconSolid }
      ] : []),
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

            {/* Global Search */}
            <div className="px-4 pb-4 border-b border-white/10">
              <GlobalSearch />
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
                <div className="flex items-center gap-2">
                  <DarkModeToggle />
                  <NotificationCenter />
                  <PushNotificationManager />
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
                      onClick={() => {
                        // DB fallback handles access - just reload to refresh UI
                        setShowUserMenu(false)
                        window.location.reload()
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

