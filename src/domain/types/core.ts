/**
 * Tipos del dominio CORE - Sistema de gestión financiera
 *
 * Jerarquía:
 * BILLETERAS (dinero real) → SOBRES (presupuesto virtual) → CATEGORÍAS (conceptos) → SUBCATEGORÍAS (marcas)
 */

/**
 * MONEDAS
 */

export enum TipoMoneda {
  FIAT = 'FIAT',
  INDICE = 'INDICE',
  CRYPTO = 'CRYPTO',
}

export interface Moneda {
  id: string // CLP, USD, EUR, UF
  nombre: string
  simbolo: string
  decimales: number
  tipo: TipoMoneda
  activa: boolean
  orden: number
  created_at: Date
  updated_at: Date
}

export interface TipoCambio {
  moneda_origen: string
  moneda_destino: string
  tasa: number
  fecha: Date
  fuente?: string
  created_at: Date
}

/**
 * USER CONFIG
 */

export enum TipoPeriodo {
  SEMANAL = 'SEMANAL',
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
  CUSTOM = 'CUSTOM',
}

export interface UserConfig {
  user_id: string
  moneda_principal_id: string
  monedas_habilitadas: string[]
  timezone: string
  locale: string
  primer_dia_semana: number
  tipo_periodo: TipoPeriodo
  dia_inicio_periodo: number
  created_at: Date
  updated_at: Date
}

/**
 * BILLETERAS - Dinero real
 */

export enum TipoBilletera {
  // Sin interés
  DEBITO = 'DEBITO',
  EFECTIVO = 'EFECTIVO',
  AHORRO = 'AHORRO',
  CUENTA_VISTA = 'CUENTA_VISTA',

  // Con interés (créditos)
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  LINEA_CREDITO = 'LINEA_CREDITO',
  SOBREGIRO = 'SOBREGIRO',
  PRESTAMO = 'PRESTAMO',
}

export interface BilleteraSaldoMultimoneda {
  real: number
  proyectado: number
}

export interface Billetera {
  id: string
  nombre: string
  tipo: TipoBilletera

  // FASE 1: Moneda principal
  moneda_principal_id: string
  saldo_real: number
  saldo_proyectado: number

  // FASE 2: Monedas adicionales (futuro)
  saldos_multimoneda?: Record<string, BilleteraSaldoMultimoneda>

  // Personalización
  color?: string
  emoji?: string

  is_compartida: boolean
  usuario_id: string // Owner
  created_at: Date
  updated_at: Date
  deleted_at?: Date // Soft delete
}

/**
 * SOBRES - Presupuesto virtual
 */

export enum TipoSobre {
  GASTO = 'GASTO', // Presupuesto que se resta
  AHORRO = 'AHORRO', // Meta que se suma (futuro)
  DEUDA = 'DEUDA', // Tracking de deudas (futuro)
}

export interface SobrePresupuestoMultimoneda {
  presupuesto: number
  gastado: number
}

export interface Sobre {
  id: string
  nombre: string
  tipo: TipoSobre

  // FASE 1: Moneda principal
  moneda_principal_id: string
  presupuesto_asignado?: number
  gastado?: number

  // Para tipo AHORRO (futuro)
  meta_objetivo?: number
  ahorrado_actual?: number

  // FASE 2: Monedas adicionales (futuro)
  presupuestos_multimoneda?: Record<string, SobrePresupuestoMultimoneda>

  // Personalización
  color?: string
  emoji?: string

  is_compartido: boolean
  max_participantes: number
  usuario_id: string // Owner/Creator

  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

/**
 * Relación Sobre-Usuario para compartidos
 */

export enum RolSobreUsuario {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER',
}

export interface SobreUsuarioPermisos {
  puede_invitar?: boolean
  solo_lectura?: boolean
}

export interface SobreUsuario {
  sobre_id: string
  usuario_id: string
  presupuesto_asignado: number
  gastado: number
  rol: RolSobreUsuario
  permisos?: SobreUsuarioPermisos
  created_at: Date
}

/**
 * CATEGORÍAS - Conceptos de gasto (catálogo global del usuario)
 */

export interface Categoria {
  id: string
  nombre: string
  usuario_id: string // Catálogo personal

  // Personalización
  color?: string
  emoji?: string

  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

/**
 * Relación Sobre-Categoría
 */
export interface SobreCategoria {
  sobre_id: string
  categoria_id: string
  created_at: Date
}

/**
 * SUBCATEGORÍAS - Marcas/empresas (catálogo global del usuario)
 */

export interface Subcategoria {
  id: string
  nombre: string
  categoria_id: string // Asociada a una categoría
  usuario_id: string // Catálogo personal

  // Personalización
  color?: string
  emoji?: string
  imagen_url?: string // Para logos de marcas (futuro)

  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

/**
 * TRANSACCIONES - Movimientos de dinero (serializables)
 */

export enum TipoTransaccion {
  GASTO = 'GASTO',
  INGRESO = 'INGRESO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  PAGO_TC = 'PAGO_TC', // Pago de tarjeta de crédito
  AJUSTE = 'AJUSTE', // Ajuste manual de saldo
}

export interface TransaccionPagoTC {
  monto_pagado: number
  monto_usado: number
  interes: number
}

export interface TransaccionConversion {
  tasa: number
  monto_destino: number
  moneda_destino: string
}

export interface TransaccionAutoAumento {
  sobre_id: string
  monto_aumentado: number
  razon: 'EXCESO_PRESUPUESTO'
}

export interface Transaccion {
  // OBLIGATORIOS
  id: string // UUID serializable
  monto: number
  moneda_id: string // Moneda de la transacción
  billetera_id: string
  tipo: TipoTransaccion
  usuario_id: string // Quién la creó

  // OPCIONALES (flexibles)
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion?: string
  fecha: Date

  // Para transferencias
  billetera_destino_id?: string

  // Para pagos de TC
  pago_tc?: TransaccionPagoTC

  // Para conversiones de moneda (futuro)
  conversion_info?: TransaccionConversion

  // Auto-aumentos de sobre
  auto_aumento_sobre?: TransaccionAutoAumento

  // Metadata
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  version: number // Para tracking de cambios
}

/**
 * INGRESOS RECURRENTES
 */

export enum FrecuenciaIngreso {
  MENSUAL = 'MENSUAL',
  QUINCENAL = 'QUINCENAL',
  SEMANAL = 'SEMANAL',
  ANUAL = 'ANUAL',
}

export enum EstadoIngresoRecurrente {
  ACTIVO = 'ACTIVO',
  PAUSADO = 'PAUSADO',
  ELIMINADO = 'ELIMINADO',
}

export interface IngresoRecurrenteDistribucion {
  sobre_id: string
  monto: number
}

export interface IngresoRecurrente {
  id: string
  nombre: string
  monto: number
  moneda_id: string
  frecuencia: FrecuenciaIngreso
  dia: number // Día del mes, semana, etc.
  billetera_id: string
  usuario_id: string

  // Auto-distribución a sobres
  auto_distribuir: boolean
  distribucion?: IngresoRecurrenteDistribucion[]

  // Estado
  estado: EstadoIngresoRecurrente
  proxima_ejecucion?: Date

  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

/**
 * ASIGNACIONES DE PRESUPUESTO - Tracking de qué billetera aportó a qué sobre
 */

export enum TipoAsignacion {
  INICIAL = 'INICIAL',
  AUMENTO = 'AUMENTO',
  DISMINUCION = 'DISMINUCION',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

export interface AsignacionPresupuesto {
  id: string
  sobre_id: string
  billetera_id: string
  usuario_id: string
  monto: number
  moneda_id: string
  tipo: TipoAsignacion
  created_at: Date
}

/**
 * INVITACIONES A SOBRES COMPARTIDOS
 */

export enum EstadoInvitacion {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
}

export interface InvitacionSobre {
  id: string
  sobre_id: string
  invitado_por_id: string
  invitado_user_id: string // Debe estar en linked_users del invitador
  rol: RolSobreUsuario
  estado: EstadoInvitacion
  created_at: Date
  updated_at: Date
}

/**
 * PERÍODOS (Budget periods - Skeleton para futuro)
 */

export interface Periodo {
  id: string
  user_id: string
  tipo: TipoPeriodo
  dia_inicio?: number
  fecha_inicio: Date
  fecha_fin: Date
  activo: boolean
  created_at: Date
}
