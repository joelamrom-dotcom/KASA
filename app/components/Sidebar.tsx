'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ChartBarIcon as AnalyzeIcon,
} from '@heroicons/react/24/outline'
import ThemeToggle from './ThemeToggle'
import Avatar3D from './Avatar3D'

// Hide sidebar on login/register pages
const hideSidebarPaths = ['/login', '/register']

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    // Check if sidebar was previously collapsed
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState === 'true') {
      setIsCollapsed(true)
    }
  }, [])
  
  useEffect(() => {
    // Update main content padding when sidebar collapses
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.remove('lg:pl-64')
        mainContent.classList.add('lg:pl-20')
      } else {
        mainContent.classList.remove('lg:pl-20')
        mainContent.classList.add('lg:pl-64')
      }
    }
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Hide sidebar on login/register pages
  if (hideSidebarPaths.includes(pathname)) {
    return null
  }

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/users', icon: UserGroupIcon },
    { name: 'Families', href: '/families', icon: BuildingOfficeIcon },
    { name: 'Family Cases', href: '/family-case', icon: DocumentTextIcon },
    { name: 'Price Plans', href: '/price', icon: CreditCardIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="glass-button p-2 rounded-lg text-gray-700 dark:text-gray-300"
        >
          {isMobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 glass-panel border-r border-white/20 dark:border-white/10 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'} h-20 border-b border-white/10 relative`}>
            {!isCollapsed && (
              <Link
                href="/"
                className="flex items-center space-x-3 group"
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    AI SaaS
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Platform</p>
                </div>
              </Link>
            )}
            {isCollapsed && (
              <Link
                href="/"
                className="flex items-center justify-center group"
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </Link>
            )}
            
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`absolute ${isCollapsed ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 glass-button p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hidden lg:flex items-center justify-center`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navigation.map((item, index) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => isCollapsed && setHoveredItem(item.name)}
                onMouseLeave={() => isCollapsed && setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-300 animate-slide-in ${
                    isActive(item.href)
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/80 hover:to-purple-500/80 hover:scale-105'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed && 'mr-3'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isActive(item.href) && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl"></span>
                  )}
                </Link>
                
                {/* Hover Tooltip - Only when collapsed */}
                {isCollapsed && hoveredItem === item.name && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 animate-scale-in">
                    <div className="glass-panel px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </span>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white dark:bg-gray-800 rotate-45 border-l border-b border-white/20 dark:border-white/10"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          {user && (
            <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-white/10`}>
              {isCollapsed ? (
                <div className="flex flex-col items-center space-y-3">
                  <Avatar3D 
                    name={`${user.firstName || ''} ${user.lastName || ''}`}
                    size={40}
                    className="flex-shrink-0"
                  />
                  <ThemeToggle />
                  <button
                    onClick={() => {
                      localStorage.removeItem('user')
                      window.location.href = '/login'
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Logout"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar3D 
                      name={`${user.firstName || ''} ${user.lastName || ''}`}
                      size={40}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <ThemeToggle />
                    <button
                      onClick={() => {
                        localStorage.removeItem('user')
                        window.location.href = '/login'
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}

