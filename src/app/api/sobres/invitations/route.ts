import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findInvitacionesPendientesByUser,
  findInvitacionesEnviadasByUser,
} from '@/infrastructure/database/queries/sobres.queries'

/**
 * GET /api/sobres/invitations
 * Obtener invitaciones del usuario actual
 * - recibidas: Invitaciones pendientes que el usuario puede aceptar/rechazar
 * - enviadas: Invitaciones que el usuario ha enviado a otros
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'recibidas' | 'enviadas' | null (default: both)

    if (type === 'recibidas') {
      const invitaciones = await findInvitacionesPendientesByUser(session.user.id)
      return NextResponse.json({
        success: true,
        invitaciones,
        total: invitaciones.length,
      })
    }

    if (type === 'enviadas') {
      const invitaciones = await findInvitacionesEnviadasByUser(session.user.id)
      return NextResponse.json({
        success: true,
        invitaciones,
        total: invitaciones.length,
      })
    }

    // Si no se especifica type, devolver ambas
    const [recibidas, enviadas] = await Promise.all([
      findInvitacionesPendientesByUser(session.user.id),
      findInvitacionesEnviadasByUser(session.user.id),
    ])

    return NextResponse.json({
      success: true,
      recibidas,
      enviadas,
      total: {
        recibidas: recibidas.length,
        enviadas: enviadas.length,
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/sobres/invitations error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener invitaciones' },
      { status: 500 }
    )
  }
}
