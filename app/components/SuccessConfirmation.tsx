'use client'

import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface SuccessConfirmationProps {
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export default function SuccessConfirmation({ 
  message, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: SuccessConfirmationProps) {
  if (autoClose && onClose) {
    setTimeout(() => {
      onClose()
    }, duration)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

