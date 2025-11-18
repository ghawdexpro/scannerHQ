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
    const overdue = searchParams.get('overdue') === 'true'

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (overdue) {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      query = query.eq('status', 'new').lt('created_at', threeHoursAgo)
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('[ADMIN LEADS] Failed to fetch leads:', error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        leads: leads || [],
        total: count || 0,
        limit,
        offset,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ADMIN LEADS] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leads',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
