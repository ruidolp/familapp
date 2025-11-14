import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/user/country
 * Detecta el país del usuario desde headers de Vercel o navegador
 */
export async function GET(req: NextRequest) {
  try {
    // Headers de Vercel que contienen información de geolocalización
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') || // Cloudflare
      req.headers.get('x-client-country') ||
      null

    return NextResponse.json({
      success: true,
      country: country ? country.toUpperCase() : 'CL', // Default: Chile
    })
  } catch (error) {
    console.error('Error detecting country:', error)
    return NextResponse.json(
      {
        success: false,
        country: 'CL', // Default: Chile
        error: 'Error detecting country',
      },
      { status: 200 } // Retornar 200 para que el fallback funcione
    )
  }
}
