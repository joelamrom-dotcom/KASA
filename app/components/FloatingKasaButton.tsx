'use client'

import { useState, useEffect } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import AIChatModal from './AIChatModal'

export default function FloatingKasaButton() {
  const [showChat, setShowChat] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>
      <AIChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  )
}

