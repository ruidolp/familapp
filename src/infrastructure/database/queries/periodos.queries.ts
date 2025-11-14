/**
 * Periodos Queries
 *
 * Queries para gestión de períodos de presupuesto (semanal, quincenal, mensual, custom)
 */

import { db } from '../kysely'
import type { PeriodosTable, TipoPeriodo } from '../types'

/**
 * Tipo para crear período
 */
export type CreatePeriodoData = {
  user_id: string
  tipo: TipoPeriodo
  dia_inicio?: number
  fecha_inicio: Date
  fecha_fin: Date
  activo?: boolean
}

/**
 * Buscar período por ID
 */
export async function findPeriodoById(periodoId: string) {
  return await db
    .selectFrom('periodos')
    .selectAll()
    .where('id', '=', periodoId)
    .executeTakeFirst()
}

/**
 * Buscar períodos por usuario
 */
export async function findPeriodosByUser(userId: string) {
  return await db
    .selectFrom('periodos')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('fecha_inicio', 'desc')
    .execute()
}

/**
 * Buscar períodos activos por usuario
 */
export async function findPeriodosActivosByUser(userId: string) {
  return await db
    .selectFrom('periodos')
    .selectAll()
    .where('user_id', '=', userId)
    .where('activo', '=', true)
    .orderBy('fecha_inicio', 'desc')
    .execute()
}

/**
 * Buscar período activo (actual) del usuario
 */
export async function findPeriodoActivoByUser(userId: string) {
  const now = new Date()

  return await db
    .selectFrom('periodos')
    .selectAll()
    .where('user_id', '=', userId)
    .where('fecha_inicio', '<=', now)
    .where('fecha_fin', '>=', now)
    .where('activo', '=', true)
    .orderBy('fecha_inicio', 'desc')
    .executeTakeFirst()
}

/**
 * Crear período
 */
export async function createPeriodo(periodoData: CreatePeriodoData) {
  return await db
    .insertInto('periodos')
    .values({
      ...periodoData,
      activo: periodoData.activo ?? true,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Desactivar período
 */
export async function deactivatePeriodo(periodoId: string) {
  return await db
    .updateTable('periodos')
    .set({
      activo: false,
    })
    .where('id', '=', periodoId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Activar período
 */
export async function activatePeriodo(periodoId: string) {
  return await db
    .updateTable('periodos')
    .set({
      activo: true,
    })
    .where('id', '=', periodoId)
    .returningAll()
    .executeTakeFirst()
}
