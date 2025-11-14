/**
 * Session Queries
 *
 * Queries para sesiones de NextAuth.
 * Type-safe y optimizadas.
 */

import { db } from '../kysely'
import type { SessionsTable } from '../types'

/**
 * Tipo para creación de sesión
 */
export type CreateSessionData = {
  session_token: string
  user_id: string
  expires: Date
}

/**
 * Crear nueva sesión
 */
export async function createSession(data: CreateSessionData) {
  return await db
    .insertInto('sessions')
    .values({
      ...data,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar sesión por session token
 */
export async function findSessionByToken(sessionToken: string) {
  return await db
    .selectFrom('sessions')
    .selectAll()
    .where('session_token', '=', sessionToken)
    .executeTakeFirst()
}

/**
 * Buscar sesión con datos del usuario
 */
export async function findSessionWithUser(sessionToken: string) {
  return await db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.user_id')
    .select([
      'sessions.id as session_id',
      'sessions.session_token',
      'sessions.user_id',
      'sessions.expires',
      'users.id',
      'users.name',
      'users.email',
      'users.email_verified',
      'users.phone',
      'users.phone_verified',
      'users.image',
      'users.account_type',
    ])
    .where('sessions.session_token', '=', sessionToken)
    .executeTakeFirst()
}

/**
 * Actualizar sesión (extender expiración)
 */
export async function updateSession(sessionToken: string, expires: Date) {
  return await db
    .updateTable('sessions')
    .set({
      expires,
      updated_at: new Date(),
    })
    .where('session_token', '=', sessionToken)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Eliminar sesión por token
 */
export async function deleteSession(sessionToken: string) {
  return await db
    .deleteFrom('sessions')
    .where('session_token', '=', sessionToken)
    .executeTakeFirst()
}

/**
 * Eliminar todas las sesiones de un usuario
 */
export async function deleteUserSessions(userId: string) {
  return await db
    .deleteFrom('sessions')
    .where('user_id', '=', userId)
    .execute()
}

/**
 * Obtener sesiones activas de un usuario
 */
export async function getUserActiveSessions(userId: string) {
  return await db
    .selectFrom('sessions')
    .selectAll()
    .where('user_id', '=', userId)
    .where('expires', '>', new Date())
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Eliminar sesiones expiradas (cleanup job)
 */
export async function deleteExpiredSessions() {
  return await db
    .deleteFrom('sessions')
    .where('expires', '<', new Date())
    .execute()
}
