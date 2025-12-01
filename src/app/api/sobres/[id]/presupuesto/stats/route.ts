/**
 * /api/sobres/[id]/presupuesto/stats
 *
 * Estadísticas de ajustes de presupuesto
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { obtenerStatsAjustes } from '@/application/services/presupuesto.service'

/**
 * GET /api/sobres/[id]/presupuesto/stats
 *
 * Obtener estadísticas de ajustes de presupuesto
 *
 * Query params (opcionales):
 * - year: Año del periodo
 * - month: Mes del periodo
 *
 * Response:
 * {
 *   periodo: { year, month }
 *   total_ajustes: number
 *   cantidad_aumentos: number
 *   cantidad_disminuciones: number
 *   monto_total_aumentos: number
 *   monto_total_disminuciones: number
 *   ajustes: [...]
 * }
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId } = await context.params
    const { searchParams } = new URL(req.url)

    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    const result = await obtenerStatsAjustes(
      sobreId,
      session.user.id,
      year,
      month
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
