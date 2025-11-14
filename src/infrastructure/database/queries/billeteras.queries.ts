/**
 * Billeteras Queries
 *
 * Queries para gestión de billeteras (dinero real)
 */

import { db } from '../kysely'
import type { BilleterasTable, TipoBilletera } from '../types'

/**
 * Tipo para creación de billetera
 */
export type CreateBilleteraData = {
  nombre: string
  tipo: TipoBilletera
  moneda_principal_id: string
  saldo_real: number
  saldo_proyectado: number
  color?: string
  emoji?: string
  is_compartida: boolean
  tasa_interes?: number | null
  usuario_id: string
}

/**
 * Tipo para actualización de billetera
 */
export type UpdateBilleteraData = {
  nombre?: string
  tipo?: TipoBilletera
  saldo_real?: number
  saldo_proyectado?: number
  color?: string
  emoji?: string
  is_compartida?: boolean
  tasa_interes?: number | null
}

/**
 * Buscar billetera por ID (sin soft-deleted)
 */
export async function findBilleteraById(billeteraId: string) {
  return await db
    .selectFrom('billeteras')
    .selectAll()
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar billeteras por usuario
 */
export async function findBilleterasByUser(userId: string) {
  return await db
    .selectFrom('billeteras')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Buscar billeteras activas por usuario y moneda
 */
export async function findBilleterasByUserAndMoneda(userId: string, monedaId: string) {
  return await db
    .selectFrom('billeteras')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('moneda_principal_id', '=', monedaId)
    .where('deleted_at', 'is', null)
    .execute()
}

/**
 * Crear nueva billetera
 */
export async function createBilletera(billeteraData: CreateBilleteraData) {
  return await db
    .insertInto('billeteras')
    .values({
      ...billeteraData,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar billetera
 */
export async function updateBilletera(billeteraId: string, billeteraData: UpdateBilleteraData) {
  return await db
    .updateTable('billeteras')
    .set({
      ...billeteraData,
      updated_at: new Date(),
    })
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de billetera
 */
export async function softDeleteBilletera(billeteraId: string) {
  return await db
    .updateTable('billeteras')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Actualizar saldo real de billetera
 */
export async function updateBilleteraSaldoReal(billeteraId: string, nuevoSaldo: number) {
  return await db
    .updateTable('billeteras')
    .set({
      saldo_real: nuevoSaldo,
      updated_at: new Date(),
    })
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar saldo proyectado de billetera
 */
export async function updateBilleteraSaldoProyectado(billeteraId: string, nuevoSaldo: number) {
  return await db
    .updateTable('billeteras')
    .set({
      saldo_proyectado: nuevoSaldo,
      updated_at: new Date(),
    })
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar ambos saldos de billetera
 */
export async function updateBilleteraSaldos(
  billeteraId: string,
  saldoReal: number,
  saldoProyectado: number
) {
  return await db
    .updateTable('billeteras')
    .set({
      saldo_real: saldoReal,
      saldo_proyectado: saldoProyectado,
      updated_at: new Date(),
    })
    .where('id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Calcular saldo total de billeteras por usuario (en moneda principal)
 */
export async function calcularSaldoTotalByUser(userId: string) {
  const result = await db
    .selectFrom('billeteras')
    .select((eb: any) => [
      eb.fn.sum('saldo_real').as('total_real'),
      eb.fn.sum('saldo_proyectado').as('total_proyectado'),
    ])
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  return {
    total_real: Number(result?.total_real || 0),
    total_proyectado: Number(result?.total_proyectado || 0),
  }
}

/**
 * ============================================================================
 * BILLETERAS TRANSACCIONES (Transaction history)
 * ============================================================================
 */

/**
 * Crear registro de transacción en billeteras_transacciones
 */
export async function createBilleteraTransaccion(
  billeteraId: string,
  usuarioId: string,
  tipo: any, // TipoBilleteraTransaccion
  monto: number,
  monedaId: string,
  saldoRealPost: number,
  billeteraOrigenId?: string | null,
  billeteraDestinoId?: string | null,
  descripcion?: string | null,
  fecha?: Date
) {
  return await db
    .insertInto('billeteras_transacciones')
    .values({
      billetera_id: billeteraId,
      usuario_id: usuarioId,
      tipo,
      monto,
      moneda_id: monedaId,
      saldo_real_post: saldoRealPost,
      billetera_origen_id: billeteraOrigenId || null,
      billetera_destino_id: billeteraDestinoId || null,
      descripcion: descripcion || null,
      fecha: fecha || new Date(),
    })
    .returningAll()
    .executeTakeFirst()
}
