/**
 * /api/monedas/[id]
 *
 * API endpoint para obtener una moneda específica por ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { findMonedaById } from '@/infrastructure/database/queries/monedas.queries'

/**
 * GET /api/monedas/[id]
 *
 * Obtener una moneda específica por su ID (ej: CLP, USD, EUR)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de moneda requerido' },
        { status: 400 }
      )
    }

    const moneda = await findMonedaById(id)

    if (!moneda) {
      return NextResponse.json(
        { error: 'Moneda no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...moneda,
    })
  } catch (error: any) {
    console.error('Error al obtener moneda:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
