import { NextRequest, NextResponse } from 'next/server'
import { APP_CONFIG } from '@/config/constants'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
// For production with multiple instances, use Redis or similar
const rateLimitStore: RateLimitStore = {}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 3600000) // 1 hour

/**
 * Get client identifier from request
 * Uses IP address and User-Agent for fingerprinting
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() :
             request.headers.get('x-real-ip') ||
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Create a simple hash-like identifier
  return `${ip}-${userAgent.substring(0, 50)}`
}

/**
 * Rate limiting middleware
 * @param request - Next.js request object
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 * @returns NextResponse if rate limited, null if allowed
 */
export function rateLimit(
  request: NextRequest,
  maxRequests: number = APP_CONFIG.MAX_REQUESTS_PER_MINUTE,
  windowMs: number = 60000 // 1 minute
): NextResponse | null {
  const clientId = getClientId(request)
  const now = Date.now()
  const resetTime = now + windowMs

  // Initialize or get existing rate limit data
  if (!rateLimitStore[clientId] || rateLimitStore[clientId].resetTime < now) {
    rateLimitStore[clientId] = {
      count: 1,
      resetTime
    }
    return null // Allow request
  }

  // Increment counter
  rateLimitStore[clientId].count++

  // Check if limit exceeded
  if (rateLimitStore[clientId].count > maxRequests) {
    const retryAfter = Math.ceil((rateLimitStore[clientId].resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitStore[clientId].resetTime).toISOString()
        }
      }
    )
  }

  // Request allowed
  return null
}

/**
 * Analysis-specific rate limiting
 * Limits number of solar analyses per day per client
 */
const analysisStore: { [key: string]: { count: number; resetTime: number } } = {}

export function analysissRateLimit(request: NextRequest): NextResponse | null {
  const clientId = getClientId(request)
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const resetTime = now + oneDayMs

  // Reset daily counter
  if (!analysisStore[clientId] || analysisStore[clientId].resetTime < now) {
    analysisStore[clientId] = {
      count: 1,
      resetTime
    }
    return null
  }

  analysisStore[clientId].count++

  if (analysisStore[clientId].count > APP_CONFIG.MAX_ANALYSES_PER_DAY) {
    const retryAfter = Math.ceil((analysisStore[clientId].resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Daily Limit Exceeded',
        message: 'You have reached the maximum number of solar analyses for today. Please try again tomorrow.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': APP_CONFIG.MAX_ANALYSES_PER_DAY.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(analysisStore[clientId].resetTime).toISOString()
        }
      }
    )
  }

  return null
}

/**
 * Helper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  clientId: string,
  maxRequests: number
): NextResponse {
  const data = rateLimitStore[clientId]

  if (data) {
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(data.resetTime).toISOString())
  }

  return response
}
