/**
 * /api/categorias/[id]/subcategorias
 *
 * API endpoints para gestión de subcategorías de una categoría
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerSubcategorias,
  crearSubcategoria,
} from '@/application/services/categorias.service'

/**
 * GET /api/categorias/[id]/subcategorias
 *
 * Obtener todas las subcategorías de una categoría
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

    const result = await obtenerSubcategorias(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      subcategorias: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener subcategorías:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categorias/[id]/subcategorias
 *
 * Crear una nueva subcategoría
 *
 * Body:
 * {
 *   nombre: string (requerido)
 *   color?: string
 *   emoji?: string
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

    const { id } = await context.params
    const body = await req.json()
    const { nombre, color, emoji } = body

    // Validaciones
    if (!nombre) {
      return NextResponse.json(
        { error: 'Campo requerido: nombre' },
        { status: 400 }
      )
    }

    const result = await crearSubcategoria({
      nombre,
      categoriaId: id,
      color,
      emoji,
      userId: session.user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        subcategoria: result.data,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al crear subcategoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
