/**
 * /api/sobres/[id]/participantes/[userId]
 *
 * API endpoint para eliminar un participante específico de un sobre
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { eliminarParticipante } from '@/application/services/sobres.service'

/**
 * DELETE /api/sobres/[id]/participantes/[userId]
 *
 * Eliminar un participante de un sobre
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, userId } = await context.params

    const result = await eliminarParticipante(id, session.user.id, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Participante eliminado correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar participante:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
