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

    const { status, assigned_to, notes } = body

    // Build update object
    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (notes !== undefined) {
      // Append to notes history if notes exist
      const timestamp = new Date().toISOString()
      const newNote = `[${timestamp}] ${notes}`
      updates.notes = newNote
    }

    // Update lead
    const { data, error } = await (supabase
      .from('leads')
      // @ts-expect-error - Dynamic update object
      .update(updates)
      .eq('id', id)
      .select()
      .single())

    if (error) {
      console.error('[ADMIN LEADS] Failed to update lead:', error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        lead: data,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ADMIN LEADS] Error updating lead:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update lead',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const { id } = await params

    // Fetch lead with related data
    const { data: lead, error } = await supabase
      .from('leads')
      .select(
        `
        *,
        analyses (*),
        quotes (*)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('[ADMIN LEADS] Failed to fetch lead:', error)
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        lead,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ADMIN LEADS] Error fetching lead:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lead',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 404 }
    )
  }
}
