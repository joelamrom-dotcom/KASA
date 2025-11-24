'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CameraIcon,
  QrCodeIcon,
} from '@heroicons/react/24/solid'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  color: string
}

export default function MobileQuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const quickActions: QuickAction[] = [
    {
      id: 'record-payment',
      label: 'Record Payment',
      icon: CurrencyDollarIcon,
      action: () => {
        router.push('/payments?action=add')
        setIsOpen(false)
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'add-member',
      label: 'Add Member',
      icon: UserPlusIcon,
      action: () => {
        router.push('/families?action=add-member')
        setIsOpen(false)
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'add-event',
      label: 'Add Event',
      icon: CalendarIcon,
      action: () => {
        router.push('/events?action=add')
        setIsOpen(false)
      },
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'scan-document',
      label: 'Scan Document',
      icon: CameraIcon,
      action: () => {
        // Open camera for document scanning
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            router.push(`/documents?action=upload&file=${encodeURIComponent(file.name)}`)
          }
        }
        input.click()
        setIsOpen(false)
      },
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 'generate-statement',
      label: 'Generate Statement',
      icon: DocumentTextIcon,
      action: () => {
        router.push('/statements?action=generate')
        setIsOpen(false)
      },
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
  ]

  // Only show on mobile devices
  if (typeof window === 'undefined') return null
  const isMobile = window.innerWidth < 768
  if (!isMobile) return null

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 touch-manipulation ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700 rotate-0'
        }`}
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
          <PlusIcon className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Quick Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Actions List */}
          <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 animate-slide-up">
            {quickActions.map((action, index) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-3 min-w-[180px] transition-all duration-200 touch-manipulation animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <action.icon className="h-5 w-5" />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

