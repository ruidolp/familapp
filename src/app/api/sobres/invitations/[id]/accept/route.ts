import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { acceptInvitacionSobre } from '@/infrastructure/database/queries/sobres.queries'

/**
 * POST /api/sobres/invitations/[id]/accept
 * Aceptar una invitación a sobre compartido
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invitacionId } = await context.params

    // Aceptar invitación (automáticamente renombra sobre conflictivo)
    const result = await acceptInvitacionSobre(invitacionId, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Te uniste al sobre compartido',
      sobre: {
        id: result.sobre.id,
        nombre: result.sobre.nombre,
        emoji: result.sobre.emoji,
        presupuesto_asignado: result.sobre.presupuesto_asignado,
      },
      participante: {
        rol: result.participante.rol,
        presupuesto_asignado: result.participante.presupuesto_asignado,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/sobres/invitations/[id]/accept error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}
