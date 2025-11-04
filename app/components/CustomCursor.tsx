'use client'

import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      
      // Check if hovering over clickable elements
      const target = e.target as HTMLElement
      const isClickable = 
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        window.getComputedStyle(target).cursor === 'pointer'
      
      setIsPointer(isClickable)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', updateCursor)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', updateCursor)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  if (!isVisible) return null

  return (
    <>
      {/* Outer ring */}
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.1s ease-out, width 0.3s ease, height 0.3s ease',
        }}
      >
        <div
          className={`rounded-full border-2 border-blue-500 dark:border-blue-400 transition-all duration-300 ${
            isPointer ? 'w-10 h-10 border-opacity-60' : 'w-8 h-8 border-opacity-40'
          }`}
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          }}
        />
      </div>
      
      {/* Inner dot */}
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.05s ease-out, width 0.2s ease, height 0.2s ease',
        }}
      >
        <div
          className={`rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-200 ${
            isPointer ? 'w-3 h-3' : 'w-2 h-2'
          }`}
          style={{
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        />
      </div>
    </>
  )
}

