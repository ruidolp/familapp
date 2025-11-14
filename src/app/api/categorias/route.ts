/**
 * /api/categorias
 *
 * API endpoints para gestión de categorías
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  crearCategoria,
  obtenerCategoriasUsuario,
} from '@/application/services/categorias.service'

/**
 * GET /api/categorias
 *
 * Obtener todas las categorías del usuario autenticado
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await obtenerCategoriasUsuario(session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      categorias: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categorias
 *
 * Crear una nueva categoría
 *
 * Body:
 * {
 *   nombre: string (requerido)
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
    const { nombre, color, emoji } = body

    // Validaciones
    if (!nombre) {
      return NextResponse.json(
        { error: 'Campo requerido: nombre' },
        { status: 400 }
      )
    }

    const result = await crearCategoria({
      nombre,
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
        categoria: result.data,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
