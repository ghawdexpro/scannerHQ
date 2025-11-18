import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const body = await request.json()

    const { status } = body

    // Build update object
    const updates: any = { status }

    // Set timestamps based on status
    if (status === 'viewed' && !updates.viewed_at) {
      updates.viewed_at = new Date().toISOString()
    }

    // Update quote
    const { data, error } = await (supabase
      .from('quotes')
      // @ts-expect-error - Dynamic update object
      .update(updates)
      .eq('id', id)
      .select()
      .single())

    if (error) {
      console.error('[ADMIN QUOTES] Failed to update quote:', error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        quote: data,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ADMIN QUOTES] Error updating quote:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update quote',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
