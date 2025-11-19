'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { trackEvent, trackQuoteRequest, trackCallButton } from '@/lib/analytics/tracking'

interface MagneticButtonProps {
  href: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  trackingEvent?: string
  trackingLabel?: string
}

export default function MagneticButton({
  href,
  variant = 'primary',
  children,
  trackingEvent,
  trackingLabel
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleClick = () => {
    // Track the click event
    if (trackingEvent) {
      if (trackingEvent === 'quote_request') {
        trackQuoteRequest()
      } else if (trackingEvent === 'call_button_click') {
        trackCallButton(href)
      } else {
        trackEvent(trackingEvent, {
          event_category: 'engagement',
          event_label: trackingLabel || String(children),
          button_variant: variant,
          href: href,
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = (e.clientX - centerX) * 0.3
    const distanceY = (e.clientY - centerY) * 0.3

    setPosition({ x: distanceX, y: distanceY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const baseStyles = 'inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 group relative overflow-hidden'

  const variants = {
    primary: 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:shadow-2xl hover:shadow-red-600/50',
    secondary: 'bg-white/5 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40'
  }

  return (
    <motion.a
      ref={buttonRef}
      href={href}
      className={`${baseStyles} ${variants[variant]}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      animate={position}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-red-500"
          initial={{ x: '-100%' }}
          whileHover={{ x: '0%' }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className="relative z-10">{children}</span>
      <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
    </motion.a>
  )
}
