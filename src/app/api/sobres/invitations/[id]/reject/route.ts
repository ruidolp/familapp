import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { rejectInvitacionSobre } from '@/infrastructure/database/queries/sobres.queries'
import { findUserById } from '@/infrastructure/database/queries/user.queries'
import { createBaseSobre, isSobreBase } from '@/application/services/sobres-template.service'

/**
 * POST /api/sobres/invitations/[id]/reject
 * Rechazar una invitación a sobre compartido
 * Si es un sobre base (HOGAR/PERSONAL), se crea uno propio con categorías
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

    // Rechazar invitación
    const invitacion = await rejectInvitacionSobre(invitacionId)

    if (!invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si necesita crear sobre base
    let sobreCreado = null
    if (isSobreBase(invitacion.sobre_nombre)) {
      // Es sobre base (HOGAR o PERSONAL) → crear con template
      const user = await findUserById(session.user.id)
      const monedaId = user?.config?.moneda_principal_id || 'CLP'

      const result = await createBaseSobre(
        session.user.id,
        invitacion.sobre_nombre.toUpperCase() as 'HOGAR' | 'PERSONAL',
        monedaId
      )

      sobreCreado = {
        id: result.sobre.id,
        nombre: result.sobre.nombre,
        emoji: result.sobre.emoji,
        categorias: result.categorias.length,
      }
    }

    return NextResponse.json({
      success: true,
      message: sobreCreado
        ? `Rechazaste la invitación. Creamos tu propio sobre "${sobreCreado.nombre}" con ${sobreCreado.categorias} categorías básicas.`
        : 'Invitación rechazada',
      sobre_creado: sobreCreado,
    })
  } catch (error: any) {
    console.error('❌ POST /api/sobres/invitations/[id]/reject error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al rechazar invitación' },
      { status: 500 }
    )
  }
}
