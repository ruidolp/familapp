/**
 * Verification Code Queries
 *
 * Queries para códigos de verificación (email, phone, password reset).
 * Type-safe y optimizadas.
 */

import { db } from '../kysely'
import type { VerificationCodesTable, VerificationCodeType, VerificationCodeStatus } from '../types'

/**
 * Tipo para creación de código de verificación
 */
export type CreateVerificationCodeData = {
  user_id: string
  code: string
  type: VerificationCodeType
  expires_at: Date
  used_at: Date | null
}

/**
 * Crear código de verificación
 */
export async function createVerificationCode(data: CreateVerificationCodeData) {
  return await db
    .insertInto('verification_codes')
    .values({
      ...data,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar código de verificación pendiente
 */
export async function findPendingVerificationCode(
  userId: string,
  code: string,
  type: VerificationCodeType
) {
  return await db
    .selectFrom('verification_codes')
    .selectAll()
    .where('user_id', '=', userId)
    .where('code', '=', code)
    .where('type', '=', type)
    .where('status', '=', 'PENDING')
    .executeTakeFirst()
}

/**
 * Marcar código como usado
 */
export async function markCodeAsUsed(codeId: string) {
  return await db
    .updateTable('verification_codes')
    .set({
      status: 'USED',
      used_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', codeId)
    .executeTakeFirst()
}

/**
 * Marcar código como expirado
 */
export async function markCodeAsExpired(codeId: string) {
  return await db
    .updateTable('verification_codes')
    .set({
      status: 'EXPIRED',
      updated_at: new Date(),
    })
    .where('id', '=', codeId)
    .executeTakeFirst()
}

/**
 * Invalidar todos los códigos pendientes de un usuario para un tipo específico
 */
export async function invalidatePendingCodes(
  userId: string,
  type: VerificationCodeType
) {
  return await db
    .updateTable('verification_codes')
    .set({
      status: 'EXPIRED',
      updated_at: new Date(),
    })
    .where('user_id', '=', userId)
    .where('type', '=', type)
    .where('status', '=', 'PENDING')
    .execute()
}

/**
 * Obtener códigos de verificación de un usuario
 */
export async function getUserVerificationCodes(
  userId: string,
  type?: VerificationCodeType,
  status?: VerificationCodeStatus
) {
  let query = db
    .selectFrom('verification_codes')
    .selectAll()
    .where('user_id', '=', userId)

  if (type) {
    query = query.where('type', '=', type)
  }

  if (status) {
    query = query.where('status', '=', status)
  }

  return await query
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Eliminar códigos expirados (cleanup job)
 */
export async function deleteExpiredCodes() {
  return await db
    .deleteFrom('verification_codes')
    .where('expires_at', '<', new Date())
    .execute()
}
