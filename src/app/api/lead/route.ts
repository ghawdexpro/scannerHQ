import { NextRequest, NextResponse } from 'next/server'
import { validateLeadData } from '@/lib/utils/validation'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { createClient } from '@supabase/supabase-js'
import { LeadRequest, LeadResponse, LeadErrorResponse } from '@/types/api'

// Initialize Supabase server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest): Promise<NextResponse<LeadResponse | LeadErrorResponse | any>> {
  try {
    // Apply general rate limiting
    const rateLimitResponse = rateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          message: 'Unable to parse request',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate lead data
    const validation = validateLeadData(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Please provide valid information',
          errors: validation.errors.reduce((acc, err, idx) => {
            acc[`error_${idx}`] = err
            return acc
          }, {} as Record<string, string>),
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const { name, email, phone, address, source } = validation.data!

    console.log(`[LEAD] Capturing lead: ${email}`)

    // Store lead in database
    const { data: leadData, error: dbError } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          address: address || null,
          source: source || 'website',
          status: 'new'
        }
      ])
      .select()
      .single()

    if (dbError || !leadData) {
      console.error('[LEAD] Database error:', dbError)

      // Check if email already exists
      if (dbError?.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
            message: 'This email is already in our system',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to save lead information',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log(`[LEAD] Lead saved with ID: ${leadData.id}`)

    // Return success response
    const response: LeadResponse = {
      success: true,
      leadId: leadData.id,
      message: 'Thank you! We will contact you within 3 hours.',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('[LEAD] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
