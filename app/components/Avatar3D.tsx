'use client'

import { useState, useRef } from 'react'

interface Avatar3DProps {
  name: string
  size?: number
  className?: string
  enableRotation?: boolean
}

export default function Avatar3D({
  name,
  size = 80,
  className = '',
  enableRotation = true,
}: Avatar3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableRotation || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateX = (e.clientY - centerY) * 0.15
    const rotateY = (centerX - e.clientX) * 0.15

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Main avatar */}
        <div
          className="relative rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-xl"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: isHovered ? 'translateZ(20px) scale(1.1)' : 'translateZ(0px) scale(1)',
            transition: 'transform 0.3s ease-out',
            fontSize: `${size * 0.4}px`,
          }}
        >
          {initials}

          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
            }}
          />
        </div>

        {/* 3D Shadow */}
        <div
          className="absolute inset-0 rounded-full bg-black/30 blur-xl -z-10 transition-all duration-300"
          style={{
            transform: `translateZ(-30px) translateY(${isHovered ? 15 : 8}px) scale(${isHovered ? 1.2 : 1})`,
            opacity: isHovered ? 0.8 : 0.5,
          }}
        />

        {/* Orbiting rings */}
        {isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                style={{
                  width: `${size + (i + 1) * 20}px`,
                  height: `${size + (i + 1) * 20}px`,
                  left: `-${(i + 1) * 10}px`,
                  top: `-${(i + 1) * 10}px`,
                  transform: `translateZ(${-10 - i * 5}px) rotateZ(${i * 45}deg)`,
                  animation: `orbit-3d 4s linear infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes orbit-3d {
          0% {
            transform: translateZ(-10px) rotateZ(0deg);
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateZ(-10px) rotateZ(360deg);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}

