/**
 * Domain types for Shopping Execution (Purchase Flow)
 * These types represent the local state for offline-first purchase execution
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ExecutionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'failed'

export type ItemStatus = 'pending' | 'purchased' | 'discarded'

export type NoCompraReason = 'SIN_STOCK' | 'NO_DISPONIBLE' | 'DESCARTADO'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ExecutionSettings {
  showTimer: boolean
  enablePrices: boolean
  showCategories: boolean
}

export interface BudgetConfig {
  enabled: boolean
  amount?: number
}

export interface RegistrationConfig {
  registerInBudget: boolean
  sobre_id?: string
  categoria_sobre_id?: string
  subcategoria_id?: string
  store_name?: string
}

// ============================================================================
// LOCAL EXECUTION ITEM
// ============================================================================

export interface LocalExecutionItem {
  // Local identifier
  localId: string

  // Relation to shopping list item
  shopping_list_item_id?: string

  // Product data (denormalized for offline access)
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  product_name: string

  // Category info (denormalized)
  categoria_producto_id?: string
  categoria_producto_nombre?: string
  categoria_global_id?: string

  // Item status
  status: ItemStatus

  // Quantities
  cantidad_planeada: number
  cantidad_comprada?: number
  unidad_medida?: string
  marca?: string

  // Prices
  precio_unitario?: number
  precio_total?: number

  // Metadata
  addedOnTheFly: boolean
  razon_no_comprado?: NoCompraReason

  // Visual order
  item_order: number

  // Timestamps
  updated_at: Date
}

// ============================================================================
// LOCAL SHOPPING EXECUTION
// ============================================================================

export interface LocalShoppingExecution {
  // Identification
  localId: string
  shopping_list_id: string
  user_id: string

  // Sync status
  syncStatus: SyncStatus
  serverExecutionId?: string
  lastSyncAttempt?: Date
  syncError?: string

  // Execution metadata
  status: ExecutionStatus
  started_at: Date
  completed_at?: Date

  // Budget/Sobre registration
  registration: RegistrationConfig

  // Referential budget (local only, informative)
  budget: BudgetConfig
  totalSpent: number

  // UI Settings
  settings: ExecutionSettings

  // Timer data
  timer: {
    startedAt: Date
    pausedAt?: Date
    accumulatedSeconds: number
    isRunning: boolean
  }

  // Items (denormalized for performance)
  items: LocalExecutionItem[]

  // Timestamps
  created_at: Date
  updated_at: Date
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateLocalExecutionInput {
  shopping_list_id: string
  user_id: string
  items: Array<{
    shopping_list_item_id?: string
    product_id?: string
    product_custom_id?: string
    is_catalog: boolean
    product_name: string
    categoria_producto_id?: string
    categoria_producto_nombre?: string
    categoria_global_id?: string
    cantidad_planeada: number
    unidad_medida?: string
    marca?: string
    item_order: number
  }>
  registration: RegistrationConfig
  budget: BudgetConfig
  settings: ExecutionSettings
}

export interface UpdateExecutionInput {
  status?: ExecutionStatus
  registration?: Partial<RegistrationConfig>
  budget?: Partial<BudgetConfig>
  settings?: Partial<ExecutionSettings>
  completed_at?: Date
}

export interface UpdateItemInput {
  status?: ItemStatus
  cantidad_comprada?: number
  precio_unitario?: number
  precio_total?: number
  razon_no_comprado?: NoCompraReason
}

export interface AddItemOnTheFlyInput {
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  product_name: string
  categoria_producto_id?: string
  categoria_producto_nombre?: string
  cantidad_planeada: number
  unidad_medida?: string
  marca?: string
}

// ============================================================================
// SERVER SYNC TYPES
// ============================================================================

export interface SyncExecutionPayload {
  shopping_list_id: string
  status: ExecutionStatus
  store_name?: string
  sobre_id?: string
  categoria_sobre_id?: string
  subcategoria_id?: string
  total_calculated: number
  total_manual?: number
  tiempo_transcurrido: number
  started_at: Date
  completed_at?: Date
}

export interface SyncExecutionItemPayload {
  shopping_list_item_id?: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  cantidad_comprada?: number
  unidad_medida?: string
  marca?: string
  precio_unitario?: number
  precio_total?: number
  es_comprado: boolean
  razon_no_comprado?: NoCompraReason
  es_agregado_vuelo: boolean
  categoria_producto_id?: string
  categoria_global_id?: string
}

export interface CreateTransactionPayload {
  monto: number
  tipo: 'GASTO'
  sobre_id: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion: string
  fecha: Date
  billetera_id: string
  moneda_id: string
}
