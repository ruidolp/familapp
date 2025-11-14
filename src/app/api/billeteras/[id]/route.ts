/**
 * /api/billeteras/[id]
 *
 * API endpoints para operaciones sobre una billetera específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerBilletera,
  actualizarBilletera,
  eliminarBilletera,
} from '@/application/services/billeteras.service'

/**
 * GET /api/billeteras/[id]
 *
 * Obtener una billetera por ID
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

    const result = await obtenerBilletera(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      billetera: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener billetera:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/billeteras/[id]
 * PATCH /api/billeteras/[id]
 *
 * Actualizar una billetera
 *
 * Body:
 * {
 *   nombre?: string
 *   tipo?: string
 *   isCompartida?: boolean
 *   tasaInteres?: number | null
 *   color?: string
 *   emoji?: string
 * }
 */
async function handleUpdate(
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
    const { nombre, tipo, isCompartida, tasaInteres, color, emoji } = body

    const result = await actualizarBilletera(id, session.user.id, {
      nombre,
      tipo,
      isCompartida,
      tasaInteres,
      color,
      emoji,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      billetera: result.data,
    })
  } catch (error: any) {
    console.error('Error al actualizar billetera:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = handleUpdate
export const PATCH = handleUpdate

/**
 * DELETE /api/billeteras/[id]
 *
 * Eliminar una billetera (soft delete)
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

    const result = await eliminarBilletera(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Billetera eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar billetera:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
