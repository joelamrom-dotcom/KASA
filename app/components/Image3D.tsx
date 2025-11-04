'use client'

import { useState, useRef } from 'react'

interface Image3DProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
  enableRotation?: boolean
  perspective?: number
  intensity?: number
  gradient?: string
}

export default function Image3D({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  enableRotation = true,
  perspective = 1000,
  intensity = 0.1,
  gradient = 'from-blue-500 via-purple-500 to-pink-500',
}: Image3DProps) {
  // Use placeholder.io if no src provided
  const imageSrc = src || `https://placehold.co/${width}x${height}/${gradient.includes('blue') ? '3b82f6' : '8b5cf6'}/ffffff?text=${encodeURIComponent(alt)}`
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableRotation || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateX = (e.clientY - centerY) * intensity
    const rotateY = (centerX - e.clientX) * intensity

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
      style={{ perspective: `${perspective}px` }}
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
        {/* Main image */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl w-full" style={{ height: `${height}px` }}>
          <div
            className="relative w-full h-full"
            style={{
              transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)',
              transition: 'transform 0.3s ease-out',
            }}
          >
            {/* Gradient background - always visible */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4 opacity-80">✨</div>
                <div className="text-2xl font-bold mb-2">{alt}</div>
                <div className="text-sm opacity-70">3D Interactive Preview</div>
              </div>
            </div>
            
            {/* Image overlay - only if src provided */}
            {src && (
              <img
                src={imageSrc}
                alt={alt}
                width={width}
                height={height}
                className="absolute inset-0 object-cover w-full h-full"
                style={{
                  filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                  transition: 'filter 0.3s ease-out',
                  zIndex: 1,
                }}
                onError={(e) => {
                  // Hide image if it fails to load, gradient will show
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}
            
            {/* Glow effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300`}
              style={{
                opacity: isHovered ? 0.3 : 0,
                transform: 'translateZ(10px)',
                zIndex: 2,
              }}
            />
          </div>

          {/* 3D Shadow */}
          <div
            className="absolute inset-0 rounded-2xl bg-black/20 blur-xl -z-10 transition-all duration-300"
            style={{
              transform: `translateZ(-50px) translateY(${isHovered ? 20 : 10}px)`,
              opacity: isHovered ? 0.8 : 0.5,
            }}
          />
        </div>

        {/* Floating particles effect */}
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  transform: `translateZ(${30 + i * 10}px)`,
                  animation: `float-3d 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float-3d {
          0%, 100% {
            transform: translateZ(30px) translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateZ(50px) translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

