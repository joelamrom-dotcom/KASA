'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  ChatBubbleLeftRightIcon, 
  PlusIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import AIChatModal from './AIChatModal'

export default function FloatingKasaButton() {
  const [showChat, setShowChat] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const quickActions = [
    {
      label: 'New Family',
      icon: UserGroupIcon,
      action: () => {
        router.push('/families?action=create')
        setShowMenu(false)
      },
      show: pathname?.startsWith('/families') || pathname === '/'
    },
    {
      label: 'New Payment',
      icon: CurrencyDollarIcon,
      action: () => {
        router.push('/payments?action=create')
        setShowMenu(false)
      },
      show: pathname?.startsWith('/payments') || pathname === '/'
    },
    {
      label: 'New Event',
      icon: CalendarIcon,
      action: () => {
        router.push('/events?action=create')
        setShowMenu(false)
      },
      show: pathname?.startsWith('/events') || pathname === '/'
    }
  ].filter(action => action.show)

  return (
    <>
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showMenu && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 mb-2 min-w-[200px]">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => {
                setShowChat(true)
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              AI Chat
            </button>
          </div>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
            showMenu ? 'rotate-45' : ''
          }`}
          aria-label="Quick Actions"
        >
          {showMenu ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <PlusIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      <AIChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  )
}

