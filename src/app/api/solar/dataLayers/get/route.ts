import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const latitude = searchParams.get('location.latitude')
  const longitude = searchParams.get('location.longitude')
  const radiusMeters = searchParams.get('radius_meters') || '50'
  const requiredQuality = searchParams.get('required_quality') || 'HIGH'

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: 'Missing latitude or longitude' },
      { status: 400 }
    )
  }

  const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 503 }
    )
  }

  try {
    const url = new URL('https://solar.googleapis.com/v1/dataLayers:get')
    url.searchParams.set('location.latitude', latitude)
    url.searchParams.set('location.longitude', longitude)
    url.searchParams.set('radiusMeters', radiusMeters)
    url.searchParams.set('requiredQuality', requiredQuality)
    url.searchParams.set('key', apiKey)

    console.log('[SOLAR-PROXY] Fetching data layers:', url.toString().replace(/key=[^&]+/, 'key=***'))

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      console.error('[SOLAR-PROXY] Data layers error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('[SOLAR-PROXY] Data layers success')
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[SOLAR-PROXY] Exception:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
