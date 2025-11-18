import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { createClient } from '@supabase/supabase-js'
import { generateQuotePDF } from '@/lib/pdf/quote-generator'
import { sendCustomerQuoteEmail, sendTeamNotificationEmail } from '@/lib/email/sendgrid'

// Initialize Supabase server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const {
      analysisId,
      roofType,
      propertyType,
      budget,
      timeline,
      electricityBill,
      notes
    } = body

    // Validate required fields
    if (!analysisId || !roofType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Analysis ID and roof type are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(`[QUOTE] Generating quote for analysis: ${analysisId}`)

    // Get the analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      console.error('[QUOTE] Analysis not found:', analysisError)
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found',
          message: 'The specified analysis does not exist',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Get or create customer record
    const { data: authUser } = await supabase.auth.getUser()

    let customerId = analysis.customer_id

    if (!customerId && authUser?.user) {
      // Create customer from auth user
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: authUser.user.phone || 'Customer',
          email: authUser.user.email || `${authUser.user.phone}@temp.com`,
          phone: authUser.user.phone || '',
          address: analysis.address,
          location_lat: analysis.location_lat,
          location_lng: analysis.location_lng
        })
        .select()
        .single()

      if (!customerError && newCustomer) {
        customerId = newCustomer.id
      }
    }

    // Calculate quote details from analysis
    const systemSize = analysis.system_size
    const panelCount = analysis.panel_count
    const yearlyGeneration = analysis.yearly_generation
    const installationCost = systemSize * 1500 // €1500 per kW

    // Create quotes for both scenarios
    const quotesData = [
      {
        analysis_id: analysisId,
        customer_id: customerId,
        system_size: systemSize,
        panel_count: panelCount,
        installation_cost: installationCost,
        with_grant: true,
        grant_amount: Math.min(installationCost * 0.3, 2400),
        upfront_cost: installationCost - Math.min(installationCost * 0.3, 2400),
        feed_in_tariff: 0.105,
        yearly_generation: yearlyGeneration,
        yearly_revenue: yearlyGeneration * 0.105,
        roi_years: Math.ceil((installationCost - Math.min(installationCost * 0.3, 2400)) / (yearlyGeneration * 0.105)),
        twenty_year_savings: (yearlyGeneration * 0.105 * 20) - (installationCost - Math.min(installationCost * 0.3, 2400)),
        carbon_offset: (yearlyGeneration * 0.41 * 20) / 1000, // tons of CO2
        status: 'draft',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        metadata: {
          roofType,
          propertyType,
          budget,
          timeline,
          electricityBill,
          notes
        }
      },
      {
        analysis_id: analysisId,
        customer_id: customerId,
        system_size: systemSize,
        panel_count: panelCount,
        installation_cost: installationCost,
        with_grant: false,
        grant_amount: 0,
        upfront_cost: installationCost,
        feed_in_tariff: 0.15,
        yearly_generation: yearlyGeneration,
        yearly_revenue: yearlyGeneration * 0.15,
        roi_years: Math.ceil(installationCost / (yearlyGeneration * 0.15)),
        twenty_year_savings: (yearlyGeneration * 0.15 * 20) - installationCost,
        carbon_offset: (yearlyGeneration * 0.41 * 20) / 1000, // tons of CO2
        status: 'draft',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          roofType,
          propertyType,
          budget,
          timeline,
          electricityBill,
          notes
        }
      }
    ]

    // Insert quotes
    const { data: quotes, error: quoteError } = await supabase
      .from('quotes')
      .insert(quotesData)
      .select()

    if (quoteError || !quotes) {
      console.error('[QUOTE] Failed to create quotes:', quoteError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create quotes',
          message: 'Database error while creating quotes',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log(`[QUOTE] Created ${quotes.length} quotes`)

    // TODO: Generate PDF
    // TODO: Send email notifications

    return NextResponse.json(
      {
        success: true,
        message: 'Quote generated successfully',
        quotes: quotes.map(q => ({
          id: q.id,
          withGrant: q.with_grant,
          upfrontCost: q.upfront_cost,
          yearlyRevenue: q.yearly_revenue,
          roiYears: q.roi_years,
          twentyYearSavings: q.twenty_year_savings
        })),
        timestamp: new Date().toISOString()
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[QUOTE] Unexpected error:', error)
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
