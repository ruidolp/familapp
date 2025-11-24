import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findInvitacionListaById,
  acceptInvitacionLista,
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

    // Aceptar invitación
    const resultado = await acceptInvitacionLista(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: `Te uniste a la lista "${resultado.lista.nombre}"`,
      lista: resultado.lista,
    })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/invitations/[id]/accept error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}
