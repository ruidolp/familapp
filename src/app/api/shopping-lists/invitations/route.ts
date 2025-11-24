import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findInvitacionesListasPendientesByUser,
  findInvitacionesListasEnviadasByUser,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener invitaciones recibidas (pendientes)
    const recibidas = await findInvitacionesListasPendientesByUser(session.user.id)

    // Obtener invitaciones enviadas
    const enviadas = await findInvitacionesListasEnviadasByUser(session.user.id)

    return NextResponse.json({
      success: true,
      recibidas,
      enviadas,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/invitations error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener invitaciones' },
      { status: 500 }
    )
  }
}
