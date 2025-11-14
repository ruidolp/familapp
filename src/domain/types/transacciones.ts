/**
 * Domain Types - Transacciones (Frontend)
 * Plain object types sin ColumnType de Kysely
 */

import type { TipoTransaccion } from '@/infrastructure/database/types'

/**
 * Transaccion - Objeto plano para frontend
 */
export interface Transaccion {
  id: string
  monto: number
  moneda_id: string
  billetera_id: string
  tipo: TipoTransaccion
  usuario_id: string
  sobre_id: string | null
  categoria_id: string | null
  subcategoria_id: string | null
  descripcion: string | null
  fecha: Date
  billetera_destino_id: string | null
  pago_tc: any | null
  conversion_info: any | null
  auto_aumento_sobre: any | null
  version: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/**
 * Transaccion con información extendida para UI
 */
export interface TransaccionConInfo extends Transaccion {
  moneda_codigo?: string // e.g., 'USD', 'PAB'
  categoria_nombre?: string
  subcategoria_nombre?: string
  billetera_nombre?: string
}
