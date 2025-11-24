import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findInvitacionListaById,
  rejectInvitacionLista,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const invitacion = await findInvitacionListaById(id)

    if (!invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitacion.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      )
    }

    // Rechazar invitación
    const resultado = await rejectInvitacionLista(id)

    return NextResponse.json({
      success: true,
      message: `Rechazaste la invitación a "${resultado?.lista_nombre}"`,
    })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/invitations/[id]/reject error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al rechazar invitación' },
      { status: 500 }
    )
  }
}
