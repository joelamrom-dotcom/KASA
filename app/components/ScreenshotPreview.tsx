'use client'

import { useState } from 'react'
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'

interface ScreenshotPreviewProps {
  imageUrl?: string
  title?: string
  description?: string
  className?: string
  style?: React.CSSProperties
}

export default function ScreenshotPreview({
  imageUrl = '/api/placeholder/800/600',
  title = 'Preview',
  description = 'Interactive preview',
  className = '',
  style,
}: ScreenshotPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <>
      <div 
        className={`glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 ${className}`}
        style={style}
      >
        <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
          {/* 3D wireframe background */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Preview content */}
          <div className="relative z-10 text-center p-8">
            <div className="inline-block p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl mb-4">
              <EyeIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => setIsFullscreen(true)}
              className="glass-button px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2 hover:scale-110 transition-transform"
            >
              <EyeIcon className="h-5 w-5" />
              <span>View Full Screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-7xl w-full max-h-[90vh] glass-panel rounded-2xl overflow-hidden">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 glass-button p-2 rounded-lg text-white hover:bg-red-500/50 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <div className="text-center">
                <EyeIcon className="h-24 w-24 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

