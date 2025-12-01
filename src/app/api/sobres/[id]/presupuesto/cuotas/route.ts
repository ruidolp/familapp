/**
 * /api/sobres/[id]/presupuesto/cuotas
 *
 * Gestión de cuotas por categoría en presupuestos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { configurarCuotaCategoria } from '@/application/services/presupuesto.service'

/**
 * POST /api/sobres/[id]/presupuesto/cuotas
 *
 * Crear o actualizar cuota de categoría
 *
 * Body:
 * {
 *   categoria_id: string
 *   monto_cuota: number
 * }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId } = await context.params
    const body = await req.json()

    // Validar body
    if (!body.categoria_id || body.monto_cuota === undefined) {
      return NextResponse.json(
        { error: 'Se requiere categoria_id y monto_cuota' },
        { status: 400 }
      )
    }

    const result = await configurarCuotaCategoria(
      sobreId,
      session.user.id,
      body.categoria_id,
      body.monto_cuota
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error al configurar cuota:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
