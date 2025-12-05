import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findNotificacionesNoLeidasByUser,
  findNotificacionesByUser,
  markAllNotificacionesAsRead,
} from '@/infrastructure/database/queries/notificaciones.queries'

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const notificaciones = onlyUnread
      ? await findNotificacionesNoLeidasByUser(session.user.id)
      : await findNotificacionesByUser(session.user.id, limit)

    return NextResponse.json({
      success: true,
      notificaciones,
      total: notificaciones.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Marcar todas las notificaciones como leídas
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await markAllNotificacionesAsRead(session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    })
  } catch (error: any) {
    console.error('❌ PATCH /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al marcar notificaciones' },
      { status: 500 }
    )
  }
}
