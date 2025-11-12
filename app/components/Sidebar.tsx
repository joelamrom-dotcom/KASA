'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  Bars3Icon
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
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
}

const defaultNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { href: '/families', label: 'Families', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { href: '/payments', label: 'Payments', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
  { href: '/tasks', label: 'Tasks', icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid },
  { href: '/calculations', label: 'Calculations', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
  { href: '/events', label: 'Events', icon: CalendarIcon, iconSolid: CalendarIconSolid },
  { href: '/reports', label: 'Reports', icon: PresentationChartBarIcon, iconSolid: PresentationChartBarIconSolid },
  { href: '/statements', label: 'Statements', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { href: '/settings', label: 'Settings', icon: CogIcon, iconSolid: CogIconSolid },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('sidebarNavOrder')
    if (savedOrder) {
      try {
        const savedHrefs = JSON.parse(savedOrder)
        // Reorder navItems based on saved order
        const orderedItems = savedHrefs
          .map((href: string) => defaultNavItems.find(item => item.href === href))
          .filter((item: NavItem | undefined) => item !== undefined) as NavItem[]
        
        // Add any new items that weren't in saved order
        const newItems = defaultNavItems.filter(
          item => !savedHrefs.includes(item.href)
        )
        
        setNavItems([...orderedItems, ...newItems])
      } catch (error) {
        console.error('Error loading saved nav order:', error)
      }
    }
  }, [])

  // Save order to localStorage whenever it changes
  const saveOrder = (items: NavItem[]) => {
    const hrefs = items.map(item => item.href)
    localStorage.setItem('sidebarNavOrder', JSON.stringify(hrefs))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newItems = [...navItems]
    const draggedItem = newItems[draggedIndex]
    
    // Remove dragged item from its current position
    newItems.splice(draggedIndex, 1)
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem)
    
    setNavItems(newItems)
    saveOrder(newItems)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

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
          {navItems.map((item, index) => {
            const Icon = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              ? item.iconSolid
              : item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
            const isDragging = draggedIndex === index
            const isDragOver = dragOverIndex === index
            
            return (
              <div
                key={item.href}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group/item relative ${
                  isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
                } ${isDragOver ? 'mb-8' : ''}`}
              >
                {isDragOver && (
                  <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10"></div>
                )}
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 shadow-lg backdrop-blur-sm border border-white/30'
                      : 'text-gray-700 hover:bg-white/10 hover:text-gray-900'
                  } ${isDragging ? 'pointer-events-none' : ''}`}
                >
                  <Bars3Icon className="h-4 w-4 text-gray-400 group-hover/item:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className={`font-medium flex-1 ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              </div>
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

