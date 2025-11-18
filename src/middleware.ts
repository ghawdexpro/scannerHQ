import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers
    }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options
          })
          response = NextResponse.next({
            request: {
              headers: req.headers
            }
          })
          response.cookies.set({
            name,
            value,
            ...options
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options
          })
          response = NextResponse.next({
            request: {
              headers: req.headers
            }
          })
          response.cookies.set({
            name,
            value: '',
            ...options
          })
        }
      }
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Check if route is admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (req.nextUrl.pathname === '/admin/login') {
      // Redirect to dashboard if already logged in
      if (session?.user) {
        const userRole = session.user.user_metadata?.role
        if (userRole === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        }
      }
      return response
    }

    // Protect all other admin routes
    if (!session) {
      // No session, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Check if user has admin role
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      // User is logged in but not an admin
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*']
}
