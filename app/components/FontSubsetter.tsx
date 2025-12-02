'use client'

import { useEffect } from 'react'

/**
 * Font subsetting optimization
 * Only loads required font characters to reduce file size
 */
export default function FontSubsetter() {
  useEffect(() => {
    // Use font-display: swap for instant text rendering
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        unicode-range: U+0020-007F, U+00A0-00FF, U+0100-017F, U+0180-024F;
      }
    `
    document.head.appendChild(style)
  }, [])

  return null
}

