import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  cancelInvitacionSobre,
  findInvitacionById,
  updateInvitacionRole,
} from '@/infrastructure/database/queries/sobres.queries'
import { eliminarParticipante } from '@/application/services/sobres.service'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const invitacion = await findInvitacionById(id)

    if (!invitacion) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (invitacion.invitado_por_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta invitación' },
        { status: 403 }
      )
    }

    let removedParticipant = false

    if (invitacion.estado === 'ACEPTADA' && invitacion.invitado_user_id) {
      const result = await eliminarParticipante(
        invitacion.sobre_id,
        session.user.id,
        invitacion.invitado_user_id
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      removedParticipant = true
    }

    await cancelInvitacionSobre(id, session.user.id)

    return NextResponse.json({
      success: true,
      removedParticipant,
      message: removedParticipant
        ? 'El participante fue removido y la invitación se desactivó.'
        : 'La invitación fue cancelada y el link se desactivó.',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/sobres/invitations/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar invitación' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { rol } = body

    // Validar rol
    const rolesValidos = ['ADMIN', 'CONTRIBUTOR', 'VIEWER']
    if (!rol || !rolesValidos.includes(rol)) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 })
    }

    const invitacion = await findInvitacionById(id)

    if (!invitacion) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (invitacion.invitado_por_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta invitación' },
        { status: 403 }
      )
    }

    // No permitir cambiar a OWNER
    if (rol === 'OWNER') {
      return NextResponse.json({ error: 'No se puede asignar el rol OWNER' }, { status: 400 })
    }

    await updateInvitacionRole(id, rol, invitacion.invitado_user_id)

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado correctamente',
    })
  } catch (error: any) {
    console.error('❌ PATCH /api/sobres/invitations/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar rol' },
      { status: 500 }
    )
  }
}
