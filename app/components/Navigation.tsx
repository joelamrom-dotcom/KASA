'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
<<<<<<< HEAD
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="glass-nav sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
              >
                AI SaaS Platform
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                {[
                  { path: '/dashboard', label: 'Dashboard' },
                  { path: '/families', label: 'Families' },
                  { path: '/family-case', label: 'Family Cases' },
                  { path: '/users', label: 'Users' },
                  { path: '/price', label: 'Price Plans' },
                ].map((item, index) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`group relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 animate-slide-in ${
                      isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/80 hover:to-purple-500/80 hover:scale-105'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {isActive(item.path) && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl"></span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="glass-panel px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">{user.firstName} {user.lastName}</span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="glass-button px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm px-6 py-2"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
=======
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
>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
        </div>
      </div>
    </nav>
  )
}
<<<<<<< HEAD
=======

>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
