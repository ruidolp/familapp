/**
 * Account Queries
 *
 * Queries para cuentas OAuth (Google, Facebook, etc).
 * Type-safe y optimizadas.
 */

import { db } from '../kysely'
import type { AccountsTable } from '../types'

/**
 * Tipo para creación de cuenta OAuth
 */
export type CreateAccountData = {
  user_id: string
  type: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

/**
 * Crear nueva cuenta OAuth
 */
export async function createAccount(data: CreateAccountData) {
  return await db
    .insertInto('accounts')
    .values({
      ...data,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar cuenta por provider y provider account ID
 */
export async function findAccountByProvider(provider: string, providerAccountId: string) {
  return await db
    .selectFrom('accounts')
    .selectAll()
    .where('provider', '=', provider)
    .where('provider_account_id', '=', providerAccountId)
    .executeTakeFirst()
}

/**
 * Buscar cuentas de un usuario
 */
export async function findUserAccounts(userId: string) {
  return await db
    .selectFrom('accounts')
    .selectAll()
    .where('user_id', '=', userId)
    .execute()
}

/**
 * Buscar cuenta específica de un usuario
 */
export async function findUserAccountByProvider(userId: string, provider: string) {
  return await db
    .selectFrom('accounts')
    .selectAll()
    .where('user_id', '=', userId)
    .where('provider', '=', provider)
    .executeTakeFirst()
}

/**
 * Actualizar tokens de una cuenta OAuth
 */
export async function updateAccountTokens(
  provider: string,
  providerAccountId: string,
  tokens: {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    id_token?: string
  }
) {
  return await db
    .updateTable('accounts')
    .set({
      ...tokens,
      updated_at: new Date(),
    })
    .where('provider', '=', provider)
    .where('provider_account_id', '=', providerAccountId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Eliminar cuenta OAuth
 */
export async function deleteAccount(provider: string, providerAccountId: string) {
  return await db
    .deleteFrom('accounts')
    .where('provider', '=', provider)
    .where('provider_account_id', '=', providerAccountId)
    .executeTakeFirst()
}

/**
 * Eliminar todas las cuentas de un usuario
 */
export async function deleteUserAccounts(userId: string) {
  return await db
    .deleteFrom('accounts')
    .where('user_id', '=', userId)
    .execute()
}

/**
 * Verificar si un usuario tiene cuenta OAuth vinculada
 */
export async function userHasOAuthAccount(userId: string, provider?: string): Promise<boolean> {
  let query = db
    .selectFrom('accounts')
    .select('id')
    .where('user_id', '=', userId)

  if (provider) {
    query = query.where('provider', '=', provider)
  }

  const result = await query.executeTakeFirst()
  return !!result
}
