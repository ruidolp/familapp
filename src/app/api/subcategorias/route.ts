/**
 * /api/subcategorias
 *
 * API endpoints para gestión de subcategorías
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  crearSubcategoria,
  obtenerSubcategorias,
} from '@/application/services/categorias.service'

/**
 * GET /api/subcategorias
 *
 * Obtener todas las subcategorías del usuario autenticado
 * Query params:
 *   - categoriaId?: string (filtrar por categoría)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoriaId = searchParams.get('categoriaId')

    if (categoriaId) {
      // Obtener subcategorías de una categoría específica
      const result = await obtenerSubcategorias(categoriaId, session.user.id)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        subcategorias: result.data,
      })
    } else {
      // Obtener todas las subcategorías del usuario
      const { findSubcategoriasByUser } = await import('@/infrastructure/database/queries/subcategorias.queries')
      const subcategorias = await findSubcategoriasByUser(session.user.id)

      return NextResponse.json({
        success: true,
        subcategorias,
      })
    }
  } catch (error: any) {
    console.error('Error al obtener subcategorías:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subcategorias
 *
 * Crear una nueva subcategoría
 *
 * Body:
 * {
 *   nombre: string (requerido)
 *   categoriaId: string (requerido)
 *   color?: string
 *   emoji?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { nombre, categoriaId, color, emoji } = body

    // Validaciones
    if (!nombre || !categoriaId) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, categoriaId' },
        { status: 400 }
      )
    }

    const result = await crearSubcategoria({
      nombre,
      categoriaId,
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
