/**
 * Domain Types - Billeteras (Frontend)
 * Plain object types sin ColumnType de Kysely
 */

import type { TipoBilletera } from '@/infrastructure/database/types'

/**
 * Billetera - Objeto plano para frontend
 */
export interface Billetera {
  id: string
  nombre: string
  tipo: TipoBilletera
  moneda_principal_id: string
  saldo_real: number
  saldo_proyectado: number
  saldos_multimoneda: any | null
  color: string | null
  emoji: string | null
  is_compartida: boolean
  usuario_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/**
 * Billetera con información extendida para UI
 */
export interface BilleteraConInfo extends Billetera {
  moneda_codigo?: string // e.g., 'USD', 'PAB'
  limite_credito?: number // Solo para tarjetas de crédito
}
