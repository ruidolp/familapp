/**
 * /api/sobres/[id]/presupuesto/sugerencia
 *
 * Obtener sugerencia de presupuesto basada en periodo anterior
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { obtenerSugerenciaPresupuesto } from '@/application/services/presupuesto.service'

/**
 * GET /api/sobres/[id]/presupuesto/sugerencia
 *
 * Obtener sugerencia de presupuesto
 * Basado en gastos reales del periodo anterior
 *
 * Response:
 * {
 *   monto_global_sugerido: number
 *   categorias: [
 *     {
 *       categoria_id: string
 *       categoria_nombre: string
 *       categoria_emoji: string
 *       monto_sugerido: number
 *       transacciones_periodo_anterior: number
 *     }
 *   ]
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

    const result = await obtenerSugerenciaPresupuesto(sobreId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener sugerencia:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
