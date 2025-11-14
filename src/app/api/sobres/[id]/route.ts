/**
 * /api/sobres/[id]
 *
 * API endpoints para operaciones sobre un sobre específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerSobre,
  actualizarSobre,
  eliminarSobre,
  obtenerAsignacionesSobre,
  obtenerAsignacionesUsuarioInSobre,
} from '@/application/services/sobres.service'

/**
 * GET /api/sobres/[id]
 *
 * Obtener un sobre por ID con detalles de asignaciones
 *
 * Response includes:
 * - sobre: Base sobre data
 * - asignaciones: All wallet allocations for this envelope
 * - miAsignacion: Current user's allocations (private)
 * - resumen: Summary with user breakdowns (no wallet names for others)
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

    const result = await obtenerSobre(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    // Obtener asignaciones
    const asignacionesResult = await obtenerAsignacionesSobre(id, session.user.id)
    const miAsignacionResult = await obtenerAsignacionesUsuarioInSobre(
      id,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      sobre: result.data,
      asignaciones: asignacionesResult.success ? asignacionesResult.data?.asignaciones : [],
      resumen: asignacionesResult.success ? asignacionesResult.data?.resumen : [],
      miAsignacion: miAsignacionResult.success ? miAsignacionResult.data : [],
    })
  } catch (error: any) {
    console.error('Error al obtener sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sobres/[id]
 *
 * Actualizar un sobre
 *
 * Body:
 * {
 *   nombre?: string
 *   presupuestoAsignado?: number
 *   color?: string
 *   emoji?: string
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
    const { nombre, presupuestoAsignado, color, emoji } = body

    const result = await actualizarSobre(id, session.user.id, {
      nombre,
      presupuestoAsignado,
      color,
      emoji,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      sobre: result.data,
    })
  } catch (error: any) {
    console.error('Error al actualizar sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sobres/[id]
 *
 * Eliminar un sobre (soft delete)
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

    const result = await eliminarSobre(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sobre eliminado correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
