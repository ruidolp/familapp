/**
 * Notificaciones Queries
 *
 * Queries para gestión de notificaciones del sistema
 */

import { db } from '../kysely'

export type TipoNotificacion =
  | 'PERDIDA_ACCESO_SOBRE'
  | 'PERDIDA_ACCESO_LISTA'
  | 'NUEVO_GASTO_COMPARTIDO'
  | 'PRESUPUESTO_EXCEDIDO'

export interface CreateNotificacionData {
  usuario_id: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  metadata?: Record<string, any>
}

/**
 * Crear notificación
 */
export async function createNotificacion(data: CreateNotificacionData) {
  return await db
    .insertInto('notificaciones')
    .values({
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      titulo: data.titulo,
      mensaje: data.mensaje,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      leida: false,
    })
    .returningAll()
    .executeTakeFirst()
}

/**
 * Obtener notificaciones no leídas de un usuario
 */
export async function findNotificacionesNoLeidasByUser(userId: string) {
  return await db
    .selectFrom('notificaciones')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('leida', '=', false)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Obtener todas las notificaciones de un usuario
 */
export async function findNotificacionesByUser(
  userId: string,
  limit: number = 50
) {
  return await db
    .selectFrom('notificaciones')
    .selectAll()
    .where('usuario_id', '=', userId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute()
}

/**
 * Marcar notificación como leída
 */
export async function markNotificacionAsRead(notificacionId: string) {
  return await db
    .updateTable('notificaciones')
    .set({
      leida: true,
      updated_at: new Date(),
    })
    .where('id', '=', notificacionId)
    .execute()
}

/**
 * Marcar todas las notificaciones de un usuario como leídas
 */
export async function markAllNotificacionesAsRead(userId: string) {
  return await db
    .updateTable('notificaciones')
    .set({
      leida: true,
      updated_at: new Date(),
    })
    .where('usuario_id', '=', userId)
    .where('leida', '=', false)
    .execute()
}

/**
 * Eliminar notificación
 */
export async function deleteNotificacion(notificacionId: string) {
  return await db
    .deleteFrom('notificaciones')
    .where('id', '=', notificacionId)
    .execute()
}

/**
 * Eliminar notificaciones antiguas (más de 30 días leídas)
 */
export async function cleanupOldNotificaciones() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return await db
    .deleteFrom('notificaciones')
    .where('leida', '=', true)
    .where('created_at', '<', thirtyDaysAgo)
    .execute()
}
