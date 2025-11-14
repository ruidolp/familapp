/**
 * /api/sobres/[id]/categorias
 *
 * API endpoints para gestión de categorías en un sobre
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerCategoriasBySobre,
  agregarCategoriaToSobre,
  eliminarCategoriaFromSobre,
} from '@/application/services/sobres-categorias.service'

/**
 * GET /api/sobres/[id]/categorias
 *
 * Obtener todas las categorías de un sobre con cálculo de gastos y porcentajes
 * Retorna ordenadas de mayor % a menor %
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

    const result = await obtenerCategoriasBySobre(sobreId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      categorias: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener categorías del sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sobres/[id]/categorias
 *
 * Agregar una o más categorías a un sobre
 *
 * Body:
 * {
 *   categoriaIds: string[] (requerido)
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
    const { categoriaIds } = body

    // Validaciones
    if (!categoriaIds || !Array.isArray(categoriaIds)) {
      return NextResponse.json(
        { error: 'Campo requerido: categoriaIds (array)' },
        { status: 400 }
      )
    }

    if (categoriaIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos una categoría' },
        { status: 400 }
      )
    }

    // Agregar cada categoría
    const resultados = []
    for (const categoriaId of categoriaIds) {
      const result = await agregarCategoriaToSobre(sobreId, categoriaId, session.user.id)
      resultados.push(result)
    }

    // Verificar si hubo errores
    const errores = resultados.filter((r) => !r.success)
    if (errores.length > 0) {
      return NextResponse.json(
        { error: errores[0].error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `${categoriaIds.length} categoría(s) agregada(s) al sobre`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al agregar categoría al sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
