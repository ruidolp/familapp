/**
 * User Queries
 *
 * Todas las queries relacionadas con usuarios.
 * Type-safe, reutilizables y optimizadas.
 */

import { db } from '../kysely'
import type { UsersTable } from '../types'

/**
 * Tipo para creación de usuario (sin campos generados)
 */
export type CreateUserData = {
  name: string
  email: string | null
  email_verified: Date | null
  phone: string | null
  phone_verified: Date | null
  image: string | null
  password: string | null
  account_type?: 'EMAIL' | 'PHONE'
  last_login_at: Date | null
}

/**
 * Tipo para actualización de usuario
 */
export type UpdateUserData = {
  name?: string
  email?: string | null
  email_verified?: Date | null
  phone?: string | null
  phone_verified?: Date | null
  image?: string | null
  password?: string | null
  last_login_at?: Date | null
}

/**
 * Buscar usuario por ID
 */
export async function findUserById(userId: string) {
  return await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst()
}

/**
 * Buscar usuario por email
 */
export async function findUserByEmail(email: string) {
  return await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst()
}

/**
 * Buscar usuario por teléfono
 */
export async function findUserByPhone(phone: string) {
  return await db
    .selectFrom('users')
    .selectAll()
    .where('phone', '=', phone)
    .executeTakeFirst()
}

/**
 * Buscar usuario por email O teléfono
 * Útil para login con identificador único
 */
export async function findUserByEmailOrPhone(email?: string, phone?: string) {
  let query = db.selectFrom('users').selectAll()

  if (email && phone) {
    query = query.where((eb) =>
      eb.or([eb('email', '=', email), eb('phone', '=', phone)])
    )
  } else if (email) {
    query = query.where('email', '=', email)
  } else if (phone) {
    query = query.where('phone', '=', phone)
  } else {
    return null
  }

  return await query.executeTakeFirst()
}

/**
 * Crear nuevo usuario
 * El ID se genera automáticamente por PostgreSQL usando DEFAULT gen_random_uuid()::TEXT
 */
export async function createUser(userData: CreateUserData) {
  return await db
    .insertInto('users')
    .values({
      ...userData,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar usuario por ID
 */
export async function updateUserById(userId: string, userData: UpdateUserData) {
  return await db
    .updateTable('users')
    .set({
      ...userData,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar última fecha de login
 */
export async function updateLastLogin(userId: string) {
  return await db
    .updateTable('users')
    .set({
      last_login_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .executeTakeFirst()
}

/**
 * Verificar email del usuario
 */
export async function verifyUserEmail(userId: string) {
  return await db
    .updateTable('users')
    .set({
      email_verified: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Verificar teléfono del usuario
 */
export async function verifyUserPhone(userId: string) {
  return await db
    .updateTable('users')
    .set({
      phone_verified: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar contraseña del usuario
 */
export async function updateUserPassword(userId: string, hashedPassword: string) {
  return await db
    .updateTable('users')
    .set({
      password: hashedPassword,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .executeTakeFirst()
}

/**
 * Eliminar usuario por ID (para testing/admin)
 */
export async function deleteUserById(userId: string) {
  return await db
    .deleteFrom('users')
    .where('id', '=', userId)
    .executeTakeFirst()
}

/**
 * Verificar si existe un usuario con email o teléfono
 */
export async function userExistsByEmailOrPhone(email?: string, phone?: string): Promise<boolean> {
  let query = db.selectFrom('users').select('id')

  if (email && phone) {
    query = query.where((eb) =>
      eb.or([eb('email', '=', email), eb('phone', '=', phone)])
    )
  } else if (email) {
    query = query.where('email', '=', email)
  } else if (phone) {
    query = query.where('phone', '=', phone)
  } else {
    return false
  }

  const result = await query.executeTakeFirst()
  return !!result
}
