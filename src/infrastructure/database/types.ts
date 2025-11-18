/**
 * Kysely Database Types
 *
 * Tipos generados del schema de PostgreSQL.
 * Para regenerar: npx kysely-codegen --dialect postgres --out-file src/infrastructure/database/types.ts
 */

import type { ColumnType } from 'kysely'

/**
 * Enums de la base de datos
 */
export type AccountType = 'EMAIL' | 'PHONE'
export type VerificationCodeType = 'EMAIL_CONFIRMATION' | 'PHONE_CONFIRMATION' | 'PASSWORD_RESET'
export type VerificationCodeStatus = 'PENDING' | 'USED' | 'EXPIRED'

/**
 * Enums de suscripciones
 */
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'payment_failed' | 'free'
export type SubscriptionPlatform = 'web' | 'ios' | 'android'
export type SubscriptionPeriod = 'monthly' | 'yearly'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'
export type SubscriptionEventType =
  | 'trial_started'
  | 'trial_expired'
  | 'upgraded'
  | 'downgraded'
  | 'cancelled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'linked'
  | 'unlinked'

/**
 * Enums de themes
 */
export type ThemeCategory = 'preestablished' | 'custom'

/**
 * Enums CORE - Financial System
 * NOTE: Also defined in custom-enums.ts for imports to avoid being overwritten by npm run db:types
 */
export type TipoMoneda = 'FIAT' | 'INDICE' | 'CRYPTO'
export type TipoBilletera = 'DEBITO' | 'CREDITO' | 'EFECTIVO' | 'AHORRO' | 'INVERSION' | 'PRESTAMO'
export type TipoBilleteraTransaccion = 'CREACION' | 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA' | 'GASTO' | 'ASIGNACION_SOBRE' | 'DEVOLUCION_SOBRE' | 'AJUSTE'
export type TipoSobre = 'GASTO' | 'AHORRO' | 'DEUDA'
export type TipoTransaccion = 'GASTO' | 'INGRESO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'PAGO_TC' | 'AJUSTE'
export type FrecuenciaIngreso = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL'
export type EstadoIngresoRecurrente = 'ACTIVO' | 'PAUSADO' | 'ELIMINADO'
export type TipoAsignacionPresupuesto = 'INICIAL' | 'AUMENTO' | 'DISMINUCION' | 'TRANSFERENCIA'
export type EstadoInvitacionSobre = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA'
export type RolSobreUsuario = 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'
export type TipoPeriodo = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM'

/**
 * Helper type para columnas generadas (timestamps, etc)
 */
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

/**
 * Helper type para columnas timestamp
 */
export type Timestamp = ColumnType<Date, Date | string, Date | string>

/**
 * Tabla: users
 */
export interface UsersTable {
  id: Generated<string>
  name: string
  email: string | null
  email_verified: Timestamp | null
  phone: string | null
  phone_verified: Timestamp | null
  image: string | null
  password: string | null
  account_type: Generated<AccountType>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  last_login_at: Timestamp | null
}

/**
 * Tabla: accounts (OAuth providers)
 */
export interface AccountsTable {
  id: Generated<string>
  user_id: string
  type: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: sessions (NextAuth sessions)
 */
export interface SessionsTable {
  id: Generated<string>
  session_token: string
  user_id: string
  expires: Timestamp
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: verification_tokens (NextAuth verification)
 */
export interface VerificationTokensTable {
  identifier: string
  token: string
  expires: Timestamp
}

/**
 * Tabla: verification_codes (custom verification codes)
 */
export interface VerificationCodesTable {
  id: Generated<string>
  user_id: string
  code: string
  type: VerificationCodeType
  status: Generated<VerificationCodeStatus>
  expires_at: Timestamp
  used_at: Timestamp | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: subscription_plans (Planes de suscripción disponibles)
 */
export interface SubscriptionPlansTable {
  id: Generated<string>
  slug: string // 'free', 'premium', 'familiar'
  name: string
  description: string | null
  trial_days: number
  max_linked_users: number
  active: Generated<boolean>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: plan_capabilities (Capacidades habilitadas por plan)
 */
export interface PlanCapabilitiesTable {
  id: Generated<string>
  plan_id: string
  capability_key: string // 'export_data', 'advanced_reports', etc.
  enabled: Generated<boolean>
  created_at: Generated<Timestamp>
}

/**
 * Tabla: plan_limits (Límites de recursos por plan)
 */
export interface PlanLimitsTable {
  id: Generated<string>
  plan_id: string
  resource_key: string // 'projects', 'storage_mb', etc.
  max_quantity: number | null // null = ilimitado
  created_at: Generated<Timestamp>
}

/**
 * Tabla: user_subscriptions (Suscripción activa de cada usuario)
 */
export interface UserSubscriptionsTable {
  id: Generated<string>
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  platform: SubscriptionPlatform | null
  platform_subscription_id: string | null // ID en Stripe/Apple/Google
  period: SubscriptionPeriod | null // 'monthly' o 'yearly'
  started_at: Timestamp
  expires_at: Timestamp | null
  trial_ends_at: Timestamp | null
  cancelled_at: Timestamp | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: linked_users (Usuarios vinculados a una suscripción)
 */
export interface LinkedUsersTable {
  id: Generated<string>
  owner_user_id: string // Quien paga el plan
  linked_user_id: string // Quien recibe acceso
  linked_at: Generated<Timestamp>
  created_at: Generated<Timestamp>
}

/**
 * Tabla: invitation_codes (Códigos de invitación para vincular usuarios)
 */
export interface InvitationCodesTable {
  id: Generated<string>
  code: string // Código único (ej: ABC123XYZ)
  owner_user_id: string // Quien genera la invitación
  plan_id: string // Plan que se compartirá
  status: Generated<InvitationStatus>
  max_uses: number // Cuántas veces se puede usar
  uses_count: Generated<number>
  expires_at: Timestamp
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: subscription_history (Auditoría de cambios en suscripciones)
 */
export interface SubscriptionHistoryTable {
  id: Generated<string>
  user_id: string
  event_type: SubscriptionEventType
  from_plan_id: string | null
  to_plan_id: string | null
  platform: SubscriptionPlatform | null
  metadata: string | null // JSON con datos adicionales
  created_at: Generated<Timestamp>
}

/**
 * Tabla: payment_products (Productos de pago por plan/plataforma/moneda)
 */
export interface PaymentProductsTable {
  id: Generated<string>
  plan_id: string
  platform: SubscriptionPlatform
  period: SubscriptionPeriod
  currency: string // 'USD', 'EUR', etc.
  price: number // Decimal como número
  platform_product_id: string // 'premium_monthly_usd' en Stripe, etc.
  active: Generated<boolean>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: themes (Temas del sistema)
 */
export interface ThemesTable {
  id: Generated<string>
  slug: string
  name: string
  description: string | null
  category: ThemeCategory
  colors: string // JSON con colores CSS
  is_active: Generated<boolean>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: user_theme_preferences (Preferencias de tema por usuario)
 */
export interface UserThemePreferencesTable {
  id: Generated<string>
  user_id: string
  theme_id: string
  custom_colors: string | null // JSON con colores personalizados (opcional)
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: user_preferences (Preferencias de usuario para listas de compras)
 */
export interface UserPreferencesTable {
  id: Generated<string>
  user_id: string
  show_inline_qty: Generated<boolean>
  group_by_category: Generated<boolean>
  quick_list_mode: Generated<boolean>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * CORE - Financial System Tables
 */

/**
 * Tabla: monedas (Catálogo de monedas)
 */
export interface MonedasTable {
  id: string // 'CLP', 'USD', 'EUR', 'UF'
  nombre: string
  simbolo: string
  decimales: Generated<number>
  tipo: Generated<TipoMoneda>
  activa: Generated<boolean>
  orden: Generated<number>
}

/**
 * Tabla: tipos_cambio (Tasas de cambio)
 */
export interface TiposCambioTable {
  moneda_origen: string
  moneda_destino: string
  tasa: number // DECIMAL(18,6)
  fecha: Timestamp
  fuente: string | null
}

/**
 * Tabla: user_config (Configuración de usuario)
 */
export interface UserConfigTable {
  user_id: string
  moneda_principal_id: Generated<string>
  monedas_habilitadas: string[] // JSONB array
  timezone: Generated<string>
  locale: Generated<string>
  primer_dia_semana: Generated<number>
  tipo_periodo: Generated<TipoPeriodo>
  dia_inicio_periodo: Generated<number>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: billeteras (Dinero real)
 */
export interface BilleterasTable {
  id: Generated<string>
  nombre: string
  tipo: TipoBilletera
  moneda_principal_id: Generated<string>
  saldo_real: number // DECIMAL(15,2) - permitte ser insertado
  saldo_proyectado: number // DECIMAL(15,2) - permite ser insertado
  saldos_multimoneda: any | null // JSONB
  color: string | null
  emoji: string | null
  is_compartida: Generated<boolean>
  tasa_interes: number | null // DECIMAL(5,2) - Interest rate for savings/investment
  usuario_id: string
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: sobres (Presupuesto virtual)
 */
export interface SobresTable {
  id: Generated<string>
  nombre: string
  tipo: Generated<TipoSobre>
  moneda_principal_id: Generated<string>
  presupuesto_asignado: Generated<number> // DECIMAL(15,2)
  gastado: Generated<number> // DECIMAL(15,2)
  presupuestos_multimoneda: any | null // JSONB
  color: string | null
  emoji: string | null
  is_compartido: Generated<boolean>
  max_participantes: Generated<number>
  usuario_id: string
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: sobres_usuarios (Tracking individual en sobres compartidos)
 */
export interface SobresUsuariosTable {
  sobre_id: string
  usuario_id: string
  presupuesto_asignado: Generated<number> // DECIMAL(15,2)
  gastado: Generated<number> // DECIMAL(15,2)
  rol: Generated<RolSobreUsuario>
  permisos: any | null // JSONB
  created_at: Generated<Timestamp>
}

/**
 * Tabla: invitaciones_sobres (Invitaciones a sobres compartidos)
 */
export interface InvitacionesSobresTable {
  id: Generated<string>
  sobre_id: string
  invitado_por_id: string
  invitado_user_id: string
  rol: Generated<RolSobreUsuario>
  estado: Generated<EstadoInvitacionSobre>
  mensaje: string | null
  created_at: Generated<Timestamp>
  expires_at: Timestamp
  accepted_at: Timestamp | null
}

/**
 * Tabla: billeteras_transacciones (Wallet operation history with balance tracking)
 */
export interface BilleterasTransaccionesTable {
  id: Generated<string>
  billetera_id: string
  usuario_id: string
  tipo: TipoBilleteraTransaccion
  monto: number // DECIMAL(15,2)
  moneda_id: string
  billetera_origen_id: string | null
  billetera_destino_id: string | null
  saldo_real_post: number // DECIMAL(15,2) - Historical saldo after operation
  descripcion: string | null
  fecha: Timestamp
  created_at: Generated<Timestamp>
  deleted_at: Timestamp | null
}

/**
 * Tabla: categorias (Categorías de gastos)
 */
export interface CategoriasTable {
  id: Generated<string>
  nombre: string
  usuario_id: string
  color: string | null
  emoji: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: sobres_categorias (Relación N:N)
 */
export interface SobresCategoriasTable {
  sobre_id: string
  categoria_id: string
  created_at: Generated<Timestamp>
}

/**
 * Tabla: subcategorias (Marcas/Empresas)
 */
export interface SubcategoriasTable {
  id: Generated<string>
  nombre: string
  categoria_id: string
  usuario_id: string
  color: string | null
  emoji: string | null
  imagen_url: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: transacciones (Movimientos financieros)
 */
export interface TransaccionesTable {
  id: Generated<string>
  monto: number // DECIMAL(15,2)
  moneda_id: string
  billetera_id: string
  tipo: TipoTransaccion
  usuario_id: string
  sobre_id: string | null
  categoria_id: string | null
  subcategoria_id: string | null
  descripcion: string | null
  fecha: Timestamp
  billetera_destino_id: string | null
  pago_tc: any | null // JSONB
  conversion_info: any | null // JSONB
  auto_aumento_sobre: any | null // JSONB
  version: Generated<number>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: asignaciones_presupuesto (Tracking de asignaciones)
 */
export interface AsignacionesPresupuestoTable {
  id: Generated<string>
  sobre_id: string
  billetera_id: string
  usuario_id: string
  monto: number // DECIMAL(15,2)
  moneda_id: string
  tipo: TipoAsignacionPresupuesto
  created_at: Generated<Timestamp>
}

/**
 * Tabla: ingresos_recurrentes (Ingresos automáticos)
 */
export interface IngresosRecurrentesTable {
  id: Generated<string>
  nombre: string
  monto: number // DECIMAL(15,2)
  moneda_id: string
  frecuencia: FrecuenciaIngreso
  dia: number
  billetera_id: string
  usuario_id: string
  auto_distribuir: Generated<boolean>
  distribucion: any | null // JSONB
  estado: Generated<EstadoIngresoRecurrente>
  proxima_ejecucion: Timestamp | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: periodos (Períodos de presupuesto)
 */
export interface PeriodosTable {
  id: Generated<string>
  user_id: string
  tipo: TipoPeriodo
  dia_inicio: number | null
  fecha_inicio: Timestamp
  fecha_fin: Timestamp
  activo: Generated<boolean>
  created_at: Generated<Timestamp>
}

/**
 * ============================================
 * SHOPPING LISTS MODULE TABLES
 * ============================================
 */

/**
 * Tabla: product_catalog (Catálogo global de productos)
 */
export interface ProductCatalogTable {
  id: Generated<string>
  nombre: string
  idioma: Generated<string>
  descripcion: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: product_user_custom (Productos personalizados del usuario)
 */
export interface ProductUserCustomTable {
  id: Generated<string>
  user_id: string
  nombre: string
  descripcion: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: product_categories_user (Categorías personales de productos)
 */
export interface ProductCategoriesUserTable {
  id: Generated<string>
  user_id: string
  nombre: string
  color: string | null
  emoji: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: product_favorites (Productos favoritos)
 */
export interface ProductFavoritesTable {
  id: Generated<string>
  user_id: string
  product_id: string | null
  product_custom_id: string | null
  is_catalog: Generated<boolean>
  created_at: Generated<Timestamp>
  deleted_at: Timestamp | null
}

/**
 * Tabla: product_frequency (Frecuencia de compra)
 */
export interface ProductFrequencyTable {
  id: Generated<string>
  user_id: string
  product_id: string | null
  product_custom_id: string | null
  is_catalog: Generated<boolean>
  count_purchases: Generated<number>
  last_purchase_date: Timestamp | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Tabla: product_prices_history (Histórico de precios)
 */
export interface ProductPricesHistoryTable {
  id: Generated<string>
  user_id: string
  product_id: string | null
  product_custom_id: string | null
  is_catalog: Generated<boolean>
  store_name: string
  price: number // DECIMAL(12,2)
  currency_id: string | null
  recorded_at: Generated<Timestamp>
}

/**
 * Tabla: shopping_lists (Listas de compras)
 */
export interface ShoppingListsTable {
  id: Generated<string>
  user_id: string
  nombre: string
  descripcion: string | null
  list_order: number | null
  purchase_count: Generated<number>
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: shopping_list_items (Items en las listas)
 */
export interface ShoppingListItemsTable {
  id: Generated<string>
  shopping_list_id: string
  product_id: string | null
  product_custom_id: string | null
  is_catalog: Generated<boolean>
  cantidad: number // DECIMAL(10,2)
  unidad_medida: string | null
  categoria_producto_id: string | null
  marca: string | null
  comentario: string | null
  item_order: number
  item_type: Generated<string>
  created_by: string
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: shopping_list_collaborators (Colaboradores en listas)
 */
export interface ShoppingListCollaboratorsTable {
  id: Generated<string>
  shopping_list_id: string
  user_id: string
  permission_level: string
  added_by: string
  created_at: Generated<Timestamp>
  deleted_at: Timestamp | null
}

/**
 * Tabla: shopping_executions (Registros de compras)
 */
export interface ShoppingExecutionsTable {
  id: Generated<string>
  shopping_list_id: string
  user_id: string
  status: Generated<string>
  store_name: string
  sobre_id: string | null
  categoria_sobre_id: string | null
  total_estimado: number | null // DECIMAL(12,2)
  total_calculated: number | null // DECIMAL(12,2)
  total_manual: number | null // DECIMAL(12,2)
  tiempo_transcurrido: number | null
  gasto_id: string | null
  started_at: Generated<Timestamp>
  completed_at: Timestamp | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

/**
 * Tabla: shopping_execution_items (Items en compras)
 */
export interface ShoppingExecutionItemsTable {
  id: Generated<string>
  shopping_execution_id: string
  shopping_list_item_id: string | null
  product_id: string | null
  product_custom_id: string | null
  is_catalog: Generated<boolean>
  cantidad_comprada: number | null // DECIMAL(10,2)
  unidad_medida: string | null
  marca: string | null
  precio_unitario: number | null // DECIMAL(12,2)
  precio_total: number | null // DECIMAL(12,2)
  es_comprado: Generated<boolean>
  razon_no_comprado: string | null
  es_agregado_vuelo: Generated<boolean>
  agregado_por: string | null
  created_at: Generated<Timestamp>
  updated_at: Timestamp
}

/**
 * Database interface con todas las tablas
 */
export interface Database {
  users: UsersTable
  accounts: AccountsTable
  sessions: SessionsTable
  verification_tokens: VerificationTokensTable
  verification_codes: VerificationCodesTable
  subscription_plans: SubscriptionPlansTable
  plan_capabilities: PlanCapabilitiesTable
  plan_limits: PlanLimitsTable
  user_subscriptions: UserSubscriptionsTable
  linked_users: LinkedUsersTable
  invitation_codes: InvitationCodesTable
  subscription_history: SubscriptionHistoryTable
  payment_products: PaymentProductsTable
  themes: ThemesTable
  user_theme_preferences: UserThemePreferencesTable
  user_preferences: UserPreferencesTable
  // CORE - Financial System
  monedas: MonedasTable
  tipos_cambio: TiposCambioTable
  user_config: UserConfigTable
  billeteras: BilleterasTable
  billeteras_transacciones: BilleterasTransaccionesTable
  sobres: SobresTable
  sobres_usuarios: SobresUsuariosTable
  invitaciones_sobres: InvitacionesSobresTable
  categorias: CategoriasTable
  sobres_categorias: SobresCategoriasTable
  subcategorias: SubcategoriasTable
  transacciones: TransaccionesTable
  asignaciones_presupuesto: AsignacionesPresupuestoTable
  ingresos_recurrentes: IngresosRecurrentesTable
  periodos: PeriodosTable
  // Shopping Lists Module
  product_catalog: ProductCatalogTable
  product_user_custom: ProductUserCustomTable
  product_categories_user: ProductCategoriesUserTable
  product_favorites: ProductFavoritesTable
  product_frequency: ProductFrequencyTable
  product_prices_history: ProductPricesHistoryTable
  shopping_lists: ShoppingListsTable
  shopping_list_items: ShoppingListItemsTable
  shopping_list_collaborators: ShoppingListCollaboratorsTable
  shopping_executions: ShoppingExecutionsTable
  shopping_execution_items: ShoppingExecutionItemsTable
}

export type Database = DB
