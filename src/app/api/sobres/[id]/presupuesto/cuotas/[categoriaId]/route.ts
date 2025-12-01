/**
 * /api/sobres/[id]/presupuesto/cuotas/[categoriaId]
 *
 * Eliminar cuota de categoría específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { eliminarCuotaCategoria } from '@/application/services/presupuesto.service'

/**
 * DELETE /api/sobres/[id]/presupuesto/cuotas/[categoriaId]
 *
 * Eliminar cuota de categoría
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

    const result = await eliminarCuotaCategoria(
      sobreId,
      session.user.id,
      categoriaId
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error al eliminar cuota:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
