/**
 * Ingresos Recurrentes Queries
 *
 * Queries para gestión de ingresos recurrentes (salario, renta, etc.)
 */

import { db } from '../kysely'

import type { IngresosRecurrentesTable, FrecuenciaIngreso, EstadoIngresoRecurrente } from '../types'

/**
 * Tipo para creación de ingreso recurrente
 */
export type CreateIngresoRecurrenteData = {
  nombre: string
  monto: number
  moneda_id: string
  frecuencia: FrecuenciaIngreso
  dia: number
  billetera_id: string
  usuario_id: string
  auto_distribuir: boolean
  distribucion?: any // JSONB
  estado: EstadoIngresoRecurrente
  proxima_ejecucion?: Date
}

/**
 * Tipo para actualización de ingreso recurrente
 */
export type UpdateIngresoRecurrenteData = {
  nombre?: string
  monto?: number
  moneda_id?: string
  dia?: number
  auto_distribuir?: boolean
  distribucion?: any // JSONB
  estado?: EstadoIngresoRecurrente
  proxima_ejecucion?: Date
}

/**
 * Buscar ingreso recurrente por ID (sin soft-deleted)
 */
export async function findIngresoRecurrenteById(ingresoId: string) {
  return await db
    .selectFrom('ingresos_recurrentes')
    .selectAll()
    .where('id', '=', ingresoId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar ingresos recurrentes por usuario
 */
export async function findIngresosRecurrentesByUser(userId: string) {
  return await db
    .selectFrom('ingresos_recurrentes')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Buscar ingresos recurrentes activos por usuario
 */
export async function findIngresosActivosByUser(userId: string) {
  return await db
    .selectFrom('ingresos_recurrentes')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('estado', '=', 'ACTIVO')
    .where('deleted_at', 'is', null)
    .orderBy('proxima_ejecucion', 'asc')
    .execute()
}

/**
 * Buscar ingresos recurrentes pendientes de ejecución
 */
export async function findIngresosPendientesEjecucion(fechaLimite: Date) {
  return await db
    .selectFrom('ingresos_recurrentes')
    .selectAll()
    .where('estado', '=', 'ACTIVO')
    .where('proxima_ejecucion', '<=', fechaLimite)
    .where('deleted_at', 'is', null)
    .orderBy('proxima_ejecucion', 'asc')
    .execute()
}

/**
 * Crear nuevo ingreso recurrente
 */
export async function createIngresoRecurrente(ingresoData: CreateIngresoRecurrenteData) {
  return await db
    .insertInto('ingresos_recurrentes')
    .values({
      ...ingresoData,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar ingreso recurrente
 */
export async function updateIngresoRecurrente(
  ingresoId: string,
  ingresoData: UpdateIngresoRecurrenteData
) {
  return await db
    .updateTable('ingresos_recurrentes')
    .set({
      ...ingresoData,
      updated_at: new Date(),
    })
    .where('id', '=', ingresoId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de ingreso recurrente
 */
export async function softDeleteIngresoRecurrente(ingresoId: string) {
  return await db
    .updateTable('ingresos_recurrentes')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', ingresoId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Pausar ingreso recurrente
 */
export async function pausarIngresoRecurrente(ingresoId: string) {
  return await updateIngresoRecurrente(ingresoId, {
    estado: 'PAUSADO',
  })
}

/**
 * Reactivar ingreso recurrente
 */
export async function reactivarIngresoRecurrente(ingresoId: string, proximaEjecucion: Date) {
  return await updateIngresoRecurrente(ingresoId, {
    estado: 'ACTIVO',
    proxima_ejecucion: proximaEjecucion,
  })
}

/**
 * Actualizar próxima ejecución
 */
export async function actualizarProximaEjecucion(ingresoId: string, proximaEjecucion: Date) {
  return await updateIngresoRecurrente(ingresoId, {
    proxima_ejecucion: proximaEjecucion,
  })
}
