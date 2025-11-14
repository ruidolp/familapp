/**
 * /api/subcategorias/[id]
 *
 * API endpoints para operaciones sobre una subcategoría específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
} from '@/application/services/categorias.service'

/**
 * GET /api/subcategorias/[id]
 *
 * Obtener una subcategoría por ID
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

    const result = await obtenerSubcategoria(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      subcategoria: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener subcategoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/subcategorias/[id]
 *
 * Actualizar una subcategoría
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

    const result = await actualizarSubcategoria(id, session.user.id, {
      nombre,
      color,
      emoji,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      subcategoria: result.data,
    })
  } catch (error: any) {
    console.error('Error al actualizar subcategoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subcategorias/[id]
 *
 * Eliminar una subcategoría (soft delete)
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

    const result = await eliminarSubcategoria(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subcategoría eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar subcategoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
