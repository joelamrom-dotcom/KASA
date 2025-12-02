'use client'

import { useEffect } from 'react'

/**
 * Animation optimization
 * Uses CSS transforms for GPU-accelerated animations
 */
export default function AnimationOptimizer() {
  useEffect(() => {
    // Add optimized animation styles
    const style = document.createElement('style')
    style.textContent = `
      /* Use transform instead of position for animations */
      .animate-transform {
        will-change: transform;
        transform: translateZ(0);
      }
      
      /* GPU acceleration for smooth animations */
      .gpu-accelerated {
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
      
      /* Optimize transitions */
      * {
        transition-property: transform, opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    `
    document.head.appendChild(style)
  }, [])

  return null
}

