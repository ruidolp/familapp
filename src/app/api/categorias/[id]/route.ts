/**
 * /api/categorias/[id]
 *
 * API endpoints para gestión de una categoría específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '@/application/services/categorias.service'

/**
 * GET /api/categorias/[id]
 *
 * Obtener una categoría por ID
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

    const result = await obtenerCategoria(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      categoria: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categorias/[id]
 *
 * Actualizar una categoría
 *
 * Body:
 * {
 *   nombre?: string
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
    const { nombre, color, emoji } = body

    const result = await actualizarCategoria(id, session.user.id, {
      nombre,
      color,
      emoji,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      categoria: result.data,
    })
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categorias/[id]
 *
 * Eliminar una categoría
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

    const result = await eliminarCategoria(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
