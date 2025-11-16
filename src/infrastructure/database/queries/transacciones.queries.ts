/**
 * Transacciones Queries
 *
 * Queries para gestión de transacciones (gastos, ingresos, transferencias)
 */

import { db } from '../kysely'

import type { TransaccionesTable, TipoTransaccion } from '../types'

/**
 * Tipo para creación de transacción
 */
export type CreateTransaccionData = {
  monto: number
  moneda_id: string
  billetera_id: string
  tipo: TipoTransaccion
  usuario_id: string
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion?: string
  fecha: Date
  billetera_destino_id?: string
  pago_tc?: any // JSONB
  conversion_info?: any // JSONB
  auto_aumento_sobre?: any // JSONB
}

/**
 * Tipo para actualización de transacción
 */
export type UpdateTransaccionData = {
  monto?: number
  moneda_id?: string
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion?: string
  fecha?: Date
}

/**
 * Buscar transacción por ID (sin soft-deleted)
 */
export async function findTransaccionById(transaccionId: string) {
  return await db
    .selectFrom('transacciones')
    .selectAll()
    .where('id', '=', transaccionId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar transacciones por usuario
 */
export async function findTransaccionesByUser(
  userId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  return await query.execute()
}

/**
 * Buscar transacciones por billetera
 */
export async function findTransaccionesByBilletera(
  billeteraId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .selectAll()
    .where('billetera_id', '=', billeteraId)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  return await query.execute()
}

/**
 * Buscar transacciones por sobre
 */
export async function findTransaccionesBySobre(
  sobreId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .leftJoin('categorias', 'categorias.id', 'transacciones.categoria_id')
    .leftJoin('subcategorias', 'subcategorias.id', 'transacciones.subcategoria_id')
    .select([
      'transacciones.id',
      'transacciones.monto',
      'transacciones.fecha',
      'transacciones.descripcion',
      'transacciones.tipo',
      'transacciones.categoria_id',
      'transacciones.subcategoria_id',
      'categorias.id as categoria_id_obj',
      'categorias.nombre as categoria_nombre',
      'categorias.emoji as categoria_emoji',
      'subcategorias.id as subcategoria_id_obj',
      'subcategorias.nombre as subcategoria_nombre',
      'subcategorias.emoji as subcategoria_emoji',
    ])
    .where('transacciones.sobre_id', '=', sobreId)
    .where('transacciones.deleted_at', 'is', null)
    .orderBy('transacciones.fecha', 'desc')

  if (fechaInicio) {
    query = query.where('transacciones.fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('transacciones.fecha', '<=', fechaFin)
  }

  const results = await query.execute()

  // Mapear resultados a estructura esperada
  return results.map((row: any) => ({
    id: row.id,
    monto: row.monto,
    fecha: row.fecha,
    descripcion: row.descripcion,
    tipo: row.tipo,
    categoria_id: row.categoria_id,
    subcategoria_id: row.subcategoria_id,
    categoria: row.categoria_nombre ? {
      id: row.categoria_id_obj,
      nombre: row.categoria_nombre,
      emoji: row.categoria_emoji,
    } : null,
    subcategoria: row.subcategoria_nombre ? {
      id: row.subcategoria_id_obj,
      nombre: row.subcategoria_nombre,
      emoji: row.subcategoria_emoji,
    } : null,
  }))
}

/**
 * Buscar transacciones por categoría
 */
export async function findTransaccionesByCategoria(
  categoriaId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .selectAll()
    .where('categoria_id', '=', categoriaId)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  return await query.execute()
}

/**
 * Buscar transacciones por subcategoría
 */
export async function findTransaccionesBySubcategoria(
  subcategoriaId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .selectAll()
    .where('subcategoria_id', '=', subcategoriaId)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  return await query.execute()
}

/**
 * Buscar transacciones por tipo
 */
export async function findTransaccionesByTipo(
  userId: string,
  tipo: TipoTransaccion,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('tipo', '=', tipo)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  return await query.execute()
}

/**
 * Crear nueva transacción
 */
export async function createTransaccion(transaccionData: CreateTransaccionData) {
  return await db
    .insertInto('transacciones')
    .values({
      ...transaccionData,
      created_at: new Date(),
      updated_at: new Date(),
      version: 1,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar transacción
 */
export async function updateTransaccion(
  transaccionId: string,
  transaccionData: UpdateTransaccionData
) {
  return await db
    .updateTable('transacciones')
    .set({
      ...transaccionData,
      updated_at: new Date(),
    })
    .where('id', '=', transaccionId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de transacción
 */
export async function softDeleteTransaccion(transaccionId: string) {
  return await db
    .updateTable('transacciones')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', transaccionId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Calcular total de gastos por sobre en un período
 */
export async function calcularTotalGastosBySobre(
  sobreId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .select((eb: any) => eb.fn.sum('monto').as('total'))
    .where('sobre_id', '=', sobreId)
    .where('tipo', '=', 'GASTO')
    .where('deleted_at', 'is', null)

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  const result = (await query.executeTakeFirst()) as { total: string | null } | undefined
  return Number(result?.total || 0)
}

/**
 * Calcular totales de ingresos y gastos por usuario en un período
 */
export async function calcularTotalesByUser(
  userId: string,
  fechaInicio?: Date,
  fechaFin?: Date
) {
  let query = db
    .selectFrom('transacciones')
    .select((eb: any) => [
      eb.fn.sum('monto').filterWhere('tipo', '=', 'INGRESO').as('total_ingresos'),
      eb.fn.sum('monto').filterWhere('tipo', '=', 'GASTO').as('total_gastos'),
    ])
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)

  if (fechaInicio) {
    query = query.where('fecha', '>=', fechaInicio)
  }
  if (fechaFin) {
    query = query.where('fecha', '<=', fechaFin)
  }

  const result = (await query.executeTakeFirst()) as
    | { total_ingresos: string | null; total_gastos: string | null }
    | undefined

  return {
    total_ingresos: Number(result?.total_ingresos || 0),
    total_gastos: Number(result?.total_gastos || 0),
    balance: Number(result?.total_ingresos || 0) - Number(result?.total_gastos || 0),
  }
}

/**
 * Obtener últimas N transacciones del usuario
 */
export async function findUltimasTransacciones(userId: string, limit: number = 10) {
  return await db
    .selectFrom('transacciones')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('fecha', 'desc')
    .limit(limit)
    .execute()
}
