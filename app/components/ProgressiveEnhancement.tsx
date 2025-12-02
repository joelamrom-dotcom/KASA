'use client'

import { useEffect, useState } from 'react'

/**
 * Progressive enhancement
 * Loads core functionality first, enhances later
 */
export default function ProgressiveEnhancement() {
  const [enhanced, setEnhanced] = useState(false)

  useEffect(() => {
    // Load core functionality immediately
    // Enhance after page is interactive
    const enhance = () => {
      if (document.readyState === 'complete') {
        setEnhanced(true)
      } else {
        window.addEventListener('load', () => setEnhanced(true))
      }
    }

    enhance()
  }, [])

  // Load enhanced features only after core is ready
  useEffect(() => {
    if (enhanced) {
      // Dynamically import enhanced features
      import('./EnhancedFeatures').catch(console.error)
    }
  }, [enhanced])

  return null
}

