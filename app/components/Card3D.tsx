'use client'

import { ReactNode } from 'react'

interface Card3DProps {
  children: ReactNode
  className?: string
  gradient?: string
  delay?: number
  style?: React.CSSProperties
}

export default function Card3D({ 
  children, 
  className = '', 
  gradient = 'from-blue-500/20 to-purple-500/20',
  delay = 0,
  style
}: Card3DProps) {
  return (
    <div
      className={`card group relative overflow-hidden animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}s`, ...(style || {}) }}
    >
      {/* 3D effect background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Wireframe overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          <defs>
            <pattern id="wireframe" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wireframe)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10"></div>
    </div>
  )
}

