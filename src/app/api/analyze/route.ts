import { NextRequest, NextResponse } from 'next/server'
import { validateAnalysisParams, sanitizeAddress } from '@/lib/utils/validation'
import { analysissRateLimit } from '@/lib/middleware/rate-limit'
import { getBuildingInsights, calculateSolarConfiguration } from '@/lib/google/solar-service'
import { analyzeRoofWithAI, calculateAISolarPotential } from '@/lib/ai/roof-detection'
import { getLocationType } from '@/lib/utils/location'
import { createClient } from '@supabase/supabase-js'
import { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse } from '@/types/api'

// Initialize Supabase server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse | AnalyzeErrorResponse | any>> {
  try {
    // Apply analysis rate limiting
    const rateLimitResponse = analysissRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid JSON in request body',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate input parameters
    const validation = validateAnalysisParams(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validation.errors.reduce((acc, err, idx) => {
            acc[`error_${idx}`] = err
            return acc
          }, {} as Record<string, string>),
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const { address, lat, lng } = validation.data!

    console.log(`[ANALYZE] Starting analysis for ${address} at (${lat}, ${lng})`)

    // Determine location type and route to appropriate analysis method
    const locationType = getLocationType(lat, lng)
    let analysisType: 'google_solar' | 'ai_fallback' = 'google_solar'
    let solarAnalysis: any = null

    console.log(`[ANALYZE] Location type detected: ${locationType}`)

    if (locationType === 'gozo') {
      // Gozo - Use AI analysis directly (Google Solar API has no coverage)
      console.log('[ANALYZE] Gozo location, using AI analysis')
      analysisType = 'ai_fallback'

      try {
        const roofAnalysis = await analyzeRoofWithAI(lat, lng)
        const aiPotential = calculateAISolarPotential(roofAnalysis)

        solarAnalysis = {
          panelsCount: aiPotential.panelCount,
          systemSize: aiPotential.systemSize,
          yearlyGeneration: aiPotential.yearlyGeneration,
          roofArea: roofAnalysis.roofArea,
          maxSunshineHours: 3000, // Malta average
          carbonOffsetYearly: aiPotential.co2Offset * 1000, // Convert to kg
          withGrant: {
            installationCost: aiPotential.systemSize * 1500,
            grantAmount: Math.min(aiPotential.systemSize * 1500 * 0.3, 2400),
            upfrontCost: aiPotential.systemSize * 1500 - Math.min(aiPotential.systemSize * 1500 * 0.3, 2400),
            feedInTariff: 0.105,
            yearlyRevenue: aiPotential.yearlyGeneration * 0.105,
            roiYears: 0,
            twentyYearSavings: 0,
            totalReturn: 0,
            projections: []
          },
          withoutGrant: {
            installationCost: aiPotential.systemSize * 1500,
            grantAmount: 0,
            upfrontCost: aiPotential.systemSize * 1500,
            feedInTariff: 0.15,
            yearlyRevenue: aiPotential.yearlyGeneration * 0.15,
            roiYears: 0,
            twentyYearSavings: 0,
            totalReturn: 0,
            projections: []
          },
          roofSegments: []
        }

        console.log('[ANALYZE] AI analysis succeeded')
      } catch (aiError: any) {
        console.error('[ANALYZE] AI analysis failed:', aiError)
        return NextResponse.json(
          {
            success: false,
            error: 'AI_ANALYSIS_ERROR',
            message: `AI roof analysis failed: ${aiError.message || aiError}`,
            timestamp: new Date().toISOString()
          },
          { status: 503 }
        )
      }
    } else if (locationType === 'malta') {
      // Malta main island - Use Google Solar API
      console.log('[ANALYZE] Malta main island location, using Google Solar API')
      analysisType = 'google_solar'

      try {
        const buildingInsights = await getBuildingInsights(lat, lng)
        solarAnalysis = calculateSolarConfiguration(buildingInsights.solarPotential)

        if (!solarAnalysis) {
          throw new Error('Failed to calculate solar configuration')
        }

        // TODO: Add presentation here (user is developing this)
        console.log('[ANALYZE] Google Solar API succeeded')
      } catch (googleError: any) {
        console.error('[ANALYZE] Google Solar API failed:', googleError)
        return NextResponse.json(
          {
            success: false,
            error: 'GOOGLE_SOLAR_ERROR',
            message: `Google Solar API failed: ${googleError.message || googleError}`,
            timestamp: new Date().toISOString()
          },
          { status: 503 }
        )
      }
    } else {
      // Location outside Malta and Gozo
      console.log('[ANALYZE] Location outside Malta/Gozo bounds')
      return NextResponse.json(
        {
          success: false,
          error: 'LOCATION_NOT_SUPPORTED',
          message: 'Solar analysis is only available for Malta and Gozo',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Store analysis in database
    const { data: analysisData, error: dbError } = await supabase
      .from('analyses')
      .insert([
        {
          address: sanitizeAddress(address),
          location_lat: lat,
          location_lng: lng,
          roof_area: solarAnalysis.roofArea,
          usable_area: solarAnalysis.roofArea * 0.75,
          panel_count: solarAnalysis.panelsCount,
          system_size: solarAnalysis.systemSize,
          yearly_generation: solarAnalysis.yearlyGeneration,
          analysis_type: analysisType,
          confidence_score: analysisType === 'google_solar' ? 0.95 : 0.75,
          raw_data: {
            locationType,
            originalRequest: { address, lat, lng },
            analysisDetails: solarAnalysis
          }
        }
      ])
      .select()
      .single()

    if (dbError || !analysisData) {
      console.error('[ANALYZE] Database error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Failed to store analysis results',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log(`[ANALYZE] Analysis stored with ID: ${analysisData.id}`)

    // Return success response
    const response: AnalyzeResponse = {
      success: true,
      analysisId: analysisData.id,
      analysisType,
      address,
      coordinates: { lat, lng },
      analysis: solarAnalysis,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('[ANALYZE] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
