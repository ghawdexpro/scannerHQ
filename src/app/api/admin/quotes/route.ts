import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'desc' // 'asc' or 'desc'

    // Build query
    let query = supabase
      .from('quotes')
      .select(
        `
        *,
        analyses (
          address,
          system_size,
          panel_count,
          analysis_type
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    const { data: quotes, error, count } = await query

    if (error) {
      console.error('[ADMIN QUOTES] Failed to fetch quotes:', error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        quotes: quotes || [],
        total: count || 0,
        limit,
        offset,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ADMIN QUOTES] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotes',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
