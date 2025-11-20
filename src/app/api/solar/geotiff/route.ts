import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Extract the id parameter from Solar API GeoTIFF URL
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing GeoTIFF id parameter' },
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
    const url = `https://solar.googleapis.com/v1/geoTiff:get?id=${id}&key=${apiKey}`

    console.log('[GEOTIFF-PROXY] Downloading:', url.replace(/key=[^&]+/, 'key=***'))

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GEOTIFF-PROXY] Download failed:', errorText)
      return new NextResponse(errorText, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()

    console.log('[GEOTIFF-PROXY] Downloaded successfully, size:', arrayBuffer.byteLength, 'bytes')

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/tiff',
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    })

  } catch (error: any) {
    console.error('[GEOTIFF-PROXY] Exception:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
