/**
 * GET /api/transacciones/totales
 *
 * Obtener totales de ingresos y gastos del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { obtenerTotales } from '@/application/services/transacciones.service'

/**
 * GET /api/transacciones/totales
 *
 * Query params:
 *   - fechaInicio?: string (ISO date)
 *   - fechaFin?: string (ISO date)
 *
 * Response:
 * {
 *   success: true,
 *   totales: {
 *     total_ingresos: number,
 *     total_gastos: number,
 *     balance: number
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fechaInicioStr = searchParams.get('fechaInicio')
    const fechaFinStr = searchParams.get('fechaFin')

    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : undefined
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : undefined

    const result = await obtenerTotales(session.user.id, fechaInicio, fechaFin)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      totales: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener totales:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
