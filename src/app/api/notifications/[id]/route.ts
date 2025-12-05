import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  markNotificacionAsRead,
  deleteNotificacion,
} from '@/infrastructure/database/queries/notificaciones.queries'
import { db } from '@/infrastructure/database/kysely'

/**
 * PATCH /api/notifications/[id]
 * Marcar notificación como leída
 */
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

    // Verificar que la notificación pertenece al usuario
    const notificacion = await db
      .selectFrom('notificaciones')
      .selectAll()
      .where('id', '=', id)
      .where('usuario_id', '=', session.user.id)
      .executeTakeFirst()

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    await markNotificacionAsRead(id)

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    })
  } catch (error: any) {
    console.error('❌ PATCH /api/notifications/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al marcar notificación' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * Eliminar notificación
 */
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

    // Verificar que la notificación pertenece al usuario
    const notificacion = await db
      .selectFrom('notificaciones')
      .selectAll()
      .where('id', '=', id)
      .where('usuario_id', '=', session.user.id)
      .executeTakeFirst()

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    await deleteNotificacion(id)

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/notifications/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar notificación' },
      { status: 500 }
    )
  }
}
