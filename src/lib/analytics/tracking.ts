/**
 * Analytics tracking utilities for Google Analytics and Meta Pixel
 */

// Type definitions for Google Analytics gtag
type GtagCommand = 'config' | 'event' | 'js' | 'set'
type GtagConfigParams = {
  page_path?: string
  page_title?: string
  [key: string]: any
}

// Type definitions for Meta Pixel fbq
type FbqCommand = 'track' | 'trackCustom' | 'init'
type FbqEventParams = Record<string, any>

// Type definitions for global tracking functions
declare global {
  interface Window {
    gtag?: (
      command: GtagCommand,
      targetIdOrDate: string | Date,
      config?: GtagConfigParams
    ) => void
    fbq?: (
      command: FbqCommand,
      eventName: string,
      parameters?: FbqEventParams
    ) => void
    dataLayer?: any[]
    _fbq?: any
  }
}

/**
 * Track a custom event in Google Analytics
 */
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  try {
    if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParams)
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn('GA tracking error:', error)
  }
}

/**
 * Track a custom event in Meta Pixel
 */
export const trackFBEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  try {
    if (typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function') {
      window.fbq('track', eventName, eventParams)
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn('FB tracking error:', error)
  }
}

/**
 * Track an event in both GA and Meta Pixel
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  trackGAEvent(eventName, eventParams)
  trackFBEvent(eventName, eventParams)
}

/**
 * Predefined conversion events
 */

export const trackAnalysisRequest = (address: string) => {
  trackEvent('analysis_request', {
    event_category: 'engagement',
    event_label: 'Solar Analysis',
    address,
  })
}

export const trackAnalysisComplete = (
  systemSize: number,
  yearlyGeneration: number,
  estimatedValue: number
) => {
  trackEvent('analysis_complete', {
    event_category: 'conversion',
    event_label: 'Analysis Complete',
    value: estimatedValue,
    system_size: systemSize,
    yearly_generation: yearlyGeneration,
  })
}

export const trackQuoteRequest = () => {
  trackEvent('quote_request', {
    event_category: 'conversion',
    event_label: 'Quote Requested',
  })

  // Track as Lead in Meta Pixel
  trackFBEvent('Lead', {
    content_name: 'Solar Quote Request',
    content_category: 'Quote',
  })
}

export const trackContactSubmit = (
  name: string,
  email: string,
  phone: string
) => {
  trackEvent('contact_submit', {
    event_category: 'conversion',
    event_label: 'Contact Form',
  })

  // Track as Lead in Meta Pixel
  trackFBEvent('Lead', {
    content_name: 'Contact Form Submission',
    content_category: 'Contact',
  })
}

export const trackCallButton = (phone: string) => {
  trackEvent('call_button_click', {
    event_category: 'engagement',
    event_label: 'Phone Call',
    phone,
  })

  // Track as Contact in Meta Pixel
  trackFBEvent('Contact', {
    content_name: 'Phone Call Initiated',
  })
}

export const trackWhatsAppClick = () => {
  trackEvent('whatsapp_click', {
    event_category: 'engagement',
    event_label: 'WhatsApp',
  })

  // Track as Contact in Meta Pixel
  trackFBEvent('Contact', {
    content_name: 'WhatsApp Initiated',
  })
}

export const trackPageView = (pagePath: string, pageTitle: string) => {
  try {
    // Google Analytics
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function' && measurementId) {
      window.gtag('config', measurementId, {
        page_path: pagePath,
        page_title: pageTitle,
      })
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn('Page view tracking error:', error)
  }

  // Meta Pixel (already tracks PageView automatically)
}

export const trackCTAClick = (ctaText: string, ctaLocation: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: ctaText,
    cta_location: ctaLocation,
  })
}

export const trackDownloadPDF = (fileName: string) => {
  trackEvent('pdf_download', {
    event_category: 'engagement',
    event_label: 'PDF Download',
    file_name: fileName,
  })
}

export const trackScrollDepth = (depth: number) => {
  trackEvent('scroll_depth', {
    event_category: 'engagement',
    event_label: `Scrolled ${depth}%`,
    value: depth,
  })
}

export const trackVideoPlay = (videoName: string) => {
  trackEvent('video_play', {
    event_category: 'engagement',
    event_label: videoName,
  })
}

export const trackFormStart = (formName: string) => {
  trackEvent('form_start', {
    event_category: 'engagement',
    event_label: formName,
  })
}

export const trackFormSubmit = (formName: string) => {
  trackEvent('form_submit', {
    event_category: 'conversion',
    event_label: formName,
  })
}

export const trackSectionView = (sectionName: string) => {
  trackEvent('section_view', {
    event_category: 'engagement',
    event_label: sectionName,
  })
}

export const trackChartInteraction = (chartName: string, interaction: string) => {
  trackEvent('chart_interaction', {
    event_category: 'engagement',
    event_label: `${chartName} - ${interaction}`,
  })
}
