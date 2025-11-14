/**
 * /api/sobres/[id]/categorias/[categoriaId]
 *
 * API endpoint para eliminar una categoría de un sobre
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  eliminarCategoriaFromSobre,
} from '@/application/services/sobres-categorias.service'

/**
 * DELETE /api/sobres/[id]/categorias/[categoriaId]
 *
 * Eliminar una categoría de un sobre (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; categoriaId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId, categoriaId } = await context.params

    const result = await eliminarCategoriaFromSobre(sobreId, categoriaId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada del sobre correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar categoría del sobre:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
