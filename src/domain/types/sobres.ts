/**
 * Domain Types - Sobres (Frontend)
 * Plain object types sin ColumnType de Kysely
 */

import type { TipoSobre } from '@/infrastructure/database/types'

/**
 * Sobre - Objeto plano para frontend
 */
export interface Sobre {
  id: string
  nombre: string
  tipo: TipoSobre
  moneda_principal_id: string
  presupuesto_asignado: number
  gastado: number
  presupuestos_multimoneda: any | null
  color: string | null
  emoji: string | null
  is_compartido: boolean
  max_participantes: number
  usuario_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
