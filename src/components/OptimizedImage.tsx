'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  responsive?: boolean
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
  blurDataURL?: string
}

/**
 * Optimized image component using Next.js Image
 * Provides automatic format conversion, responsive sizing, and lazy loading
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  responsive = true,
  sizes,
  objectFit = 'cover',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Default responsive sizes for common use cases
  const defaultSizes = responsive
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px'
    : undefined

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes || defaultSizes}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : `object-${objectFit}`} ${
          isLoading ? 'blur-sm' : 'blur-0'
        } transition-all duration-300`}
        onLoadingComplete={() => setIsLoading(false)}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
    </div>
  )
}
