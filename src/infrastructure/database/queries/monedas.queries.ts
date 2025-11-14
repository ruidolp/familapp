/**
 * Monedas Queries
 *
 * Queries para gestión de monedas (CLP, USD, EUR, UF, etc.)
 */

import { db } from '../kysely'

import type { MonedasTable } from '../types'

/**
 * Obtener todas las monedas activas
 */
export async function findAllMonedasActivas() {
  return await db
    .selectFrom('monedas')
    .selectAll()
    .where('activa', '=', true)
    .orderBy('orden', 'asc')
    .execute()
}

/**
 * Obtener todas las monedas (incluyendo inactivas)
 */
export async function findAllMonedas() {
  return await db
    .selectFrom('monedas')
    .selectAll()
    .orderBy('orden', 'asc')
    .execute()
}

/**
 * Buscar moneda por ID
 */
export async function findMonedaById(monedaId: string) {
  return await db
    .selectFrom('monedas')
    .selectAll()
    .where('id', '=', monedaId)
    .executeTakeFirst()
}

/**
 * Buscar monedas por IDs (múltiples)
 */
export async function findMonedasByIds(monedaIds: string[]) {
  if (monedaIds.length === 0) return []

  return await db
    .selectFrom('monedas')
    .selectAll()
    .where('id', 'in', monedaIds)
    .execute()
}

/**
 * Obtener monedas habilitadas para un usuario
 */
export async function findMonedasHabilitadasByUser(userId: string) {
  const userConfig = await db
    .selectFrom('user_config')
    .select('monedas_habilitadas')
    .where('user_id', '=', userId)
    .executeTakeFirst()

  if (!userConfig?.monedas_habilitadas) {
    return []
  }

  return await findMonedasByIds(userConfig.monedas_habilitadas)
}
