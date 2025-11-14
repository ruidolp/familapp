/**
 * /api/transacciones/[id]
 *
 * API endpoints para operaciones sobre una transacción específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerTransaccion,
  actualizarTransaccion,
  eliminarTransaccion,
} from '@/application/services/transacciones.service'

/**
 * GET /api/transacciones/[id]
 *
 * Obtener una transacción por ID
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

    const { id } = await context.params

    const result = await obtenerTransaccion(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transaccion: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener transacción:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/transacciones/[id]
 *
 * Actualizar una transacción
 *
 * Body:
 * {
 *   monto?: number
 *   descripcion?: string
 *   fecha?: string (ISO date)
 *   sobreId?: string
 *   categoriaId?: string
 *   subcategoriaId?: string
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

    const { id } = await context.params
    const body = await req.json()
    const { monto, descripcion, fecha, sobreId, categoriaId, subcategoriaId } = body

    const result = await actualizarTransaccion(id, session.user.id, {
      monto: monto !== undefined ? Number(monto) : undefined,
      descripcion,
      fecha: fecha ? new Date(fecha) : undefined,
      sobreId,
      categoriaId,
      subcategoriaId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transaccion: result.data,
    })
  } catch (error: any) {
    console.error('Error al actualizar transacción:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transacciones/[id]
 *
 * Eliminar una transacción (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const result = await eliminarTransaccion(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Transacción eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar transacción:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
