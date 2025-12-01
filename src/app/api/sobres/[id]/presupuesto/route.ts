/**
 * /api/sobres/[id]/presupuesto
 *
 * Gestión de configuración de presupuesto de un sobre
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerPresupuestoCompleto,
  togglePresupuesto,
  actualizarMontoGlobal,
} from '@/application/services/presupuesto.service'

/**
 * GET /api/sobres/[id]/presupuesto
 *
 * Obtener configuración completa de presupuesto
 * Incluye: config, cuotas, gastos del periodo
 *
 * Query params (opcionales):
 * - year: Año del periodo
 * - month: Mes del periodo
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

    const result = await obtenerPresupuestoCompleto(
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
    console.error('Error al obtener presupuesto:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sobres/[id]/presupuesto
 *
 * Actualizar configuración de presupuesto
 *
 * Body:
 * {
 *   enabled?: boolean          // Activar/desactivar presupuesto
 *   monto_global?: number      // Monto global del presupuesto
 * }
 */
export async function PUT(
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

    // Si se especifica enabled, usar toggle
    if (body.enabled !== undefined) {
      const result = await togglePresupuesto(
        sobreId,
        session.user.id,
        body.enabled,
        body.monto_global
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }

    // Si solo se especifica monto_global, actualizar
    if (body.monto_global !== undefined) {
      const result = await actualizarMontoGlobal(
        sobreId,
        session.user.id,
        body.monto_global
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }

    return NextResponse.json(
      { error: 'Se requiere enabled o monto_global' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error al actualizar presupuesto:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
