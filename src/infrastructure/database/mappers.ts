/**
 * Database Mappers
 * Convierte tipos de Kysely (con ColumnType) a tipos planos de dominio
 */

import type {
  BilleterasTable,
  SobresTable,
  TransaccionesTable,
} from './types'
import type { Billetera, Sobre, Transaccion } from '@/domain/types'

/**
 * Convierte BilleterasTable (Kysely) a Billetera (Domain)
 */
export function toBilletera(row: BilleterasTable): Billetera {
  return {
    id: row.id as unknown as string,
    nombre: row.nombre,
    tipo: row.tipo,
    moneda_principal_id: row.moneda_principal_id as unknown as string,
    saldo_real: Number(row.saldo_real),
    saldo_proyectado: Number(row.saldo_proyectado),
    saldos_multimoneda: row.saldos_multimoneda,
    color: row.color,
    emoji: row.emoji,
    is_compartida: row.is_compartida as unknown as boolean,
    usuario_id: row.usuario_id,
    created_at: new Date(row.created_at as unknown as Date),
    updated_at: new Date(row.updated_at as unknown as Date),
    deleted_at: row.deleted_at ? new Date(row.deleted_at as unknown as Date) : null,
  }
}

/**
 * Convierte SobresTable (Kysely) a Sobre (Domain)
 */
export function toSobre(row: SobresTable): Sobre {
  return {
    id: row.id as unknown as string,
    nombre: row.nombre,
    tipo: row.tipo as any,
    moneda_principal_id: row.moneda_principal_id as unknown as string,
    presupuesto_asignado: Number(row.presupuesto_asignado),
    gastado: Number(row.gastado),
    presupuestos_multimoneda: row.presupuestos_multimoneda,
    color: row.color,
    emoji: row.emoji,
    is_compartido: row.is_compartido as unknown as boolean,
    max_participantes: row.max_participantes as unknown as number,
    usuario_id: row.usuario_id,
    created_at: new Date(row.created_at as unknown as Date),
    updated_at: new Date(row.updated_at as unknown as Date),
    deleted_at: row.deleted_at ? new Date(row.deleted_at as unknown as Date) : null,
  }
}

/**
 * Convierte TransaccionesTable (Kysely) a Transaccion (Domain)
 */
export function toTransaccion(row: TransaccionesTable): Transaccion {
  return {
    id: row.id as unknown as string,
    monto: Number(row.monto),
    moneda_id: row.moneda_id,
    billetera_id: row.billetera_id,
    tipo: row.tipo,
    usuario_id: row.usuario_id,
    sobre_id: row.sobre_id,
    categoria_id: row.categoria_id,
    subcategoria_id: row.subcategoria_id,
    descripcion: row.descripcion,
    fecha: new Date(row.fecha as unknown as Date),
    billetera_destino_id: row.billetera_destino_id,
    pago_tc: row.pago_tc,
    conversion_info: row.conversion_info,
    auto_aumento_sobre: row.auto_aumento_sobre,
    version: row.version as unknown as number,
    created_at: new Date(row.created_at as unknown as Date),
    updated_at: new Date(row.updated_at as unknown as Date),
    deleted_at: row.deleted_at ? new Date(row.deleted_at as unknown as Date) : null,
  }
}
