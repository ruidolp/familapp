/**
 * Session Manager
 *
 * Gestión de invalidación de sesiones JWT sin forzar logout.
 * Cuando un webhook actualiza la subscription, se invalida la sesión
 * y el próximo request del usuario recarga automáticamente los datos.
 */

import { db } from '@/infrastructure/database/kysely'

/**
 * Invalidar sesión de un usuario (fuerza refresh de JWT en próximo request)
 *
 * @param userId - ID del usuario
 * @param reason - Motivo de invalidación (para debugging)
 */
export async function invalidateUserSession(
  userId: string,
  reason: string = 'subscription_updated'
): Promise<void> {
  await db
    .insertInto('invalidated_sessions')
    .values({
      user_id: userId,
      invalidated_at: new Date(),
      reason,
    })
    .execute()
}

/**
 * Verificar si el token de un usuario fue invalidado
 *
 * @param userId - ID del usuario
 * @param tokenIssuedAt - Timestamp de emisión del token JWT (en segundos)
 * @returns true si el token debe ser refrescado
 */
export async function isSessionInvalidated(
  userId: string,
  tokenIssuedAt: number
): Promise<boolean> {
  const tokenDate = new Date(tokenIssuedAt * 1000)

  const invalidation = await db
    .selectFrom('invalidated_sessions')
    .select('invalidated_at')
    .where('user_id', '=', userId)
    .where('invalidated_at', '>', tokenDate)
    .orderBy('invalidated_at', 'desc')
    .executeTakeFirst()

  return !!invalidation
}

/**
 * Limpiar sesiones invalidadas antiguas (>7 días)
 * Ejecutar en cron job o después de cada invalidación
 */
export async function cleanupOldInvalidations(): Promise<void> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  await db
    .deleteFrom('invalidated_sessions')
    .where('created_at', '<', sevenDaysAgo)
    .execute()
}
