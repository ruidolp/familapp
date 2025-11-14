/**
 * /api/monedas
 *
 * API endpoint para obtener monedas disponibles
 */

import { NextResponse } from 'next/server'
import { findAllMonedasActivas } from '@/infrastructure/database/queries/monedas.queries'

/**
 * GET /api/monedas
 *
 * Obtener todas las monedas activas
 */
export async function GET() {
  try {
    const monedas = await findAllMonedasActivas()

    return NextResponse.json({
      success: true,
      monedas,
    })
  } catch (error: any) {
    console.error('Error al obtener monedas:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
