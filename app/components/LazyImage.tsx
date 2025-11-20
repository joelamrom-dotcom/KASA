'use client'

import { useLazyImage } from '@/app/hooks/useLazyLoad'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
}

/**
 * Lazy loading image component
 * Only loads image when it's about to enter viewport
 */
export default function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3C/svg%3E',
  className = '',
  ...props
}: LazyImageProps) {
  const { imgRef, imageSrc, isLoaded, error, handleLoad, handleError } = useLazyImage(src)

  return (
    <img
      ref={imgRef}
      src={imageSrc || placeholder}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  )
}

