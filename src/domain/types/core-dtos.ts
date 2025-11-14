/**
 * DTOs (Data Transfer Objects) para APIs del CORE
 *
 * Estos tipos definen la estructura de datos que se envían/reciben
 * en las llamadas a la API.
 */

import {
  TipoBilletera,
  TipoSobre,
  TipoTransaccion,
  FrecuenciaIngreso,
  RolSobreUsuario,
  Billetera,
  Sobre,
  Categoria,
  Subcategoria,
  Transaccion,
  IngresoRecurrente,
  Moneda,
  TransaccionConversion,
} from './core'

/**
 * BILLETERAS - DTOs
 */

export interface CrearBilleteraInput {
  nombre: string
  tipo: TipoBilletera
  moneda_principal_id: string // CLP, USD, EUR, etc.
  saldo_inicial: number
  is_compartida?: boolean
  color?: string // Hex color: #FF0000
  emoji?: string // 💳, 💵, etc.
}

export interface ActualizarBilleteraInput {
  nombre?: string
  saldo_real?: number // Para ajustes/reconciliación
  color?: string
  emoji?: string
}

export interface TransferirBilleterasInput {
  billetera_origen_id: string
  billetera_destino_id: string
  monto: number
  moneda_id: string // Moneda de la transferencia
  descripcion?: string
}

export interface DepositarBilleteraInput {
  billetera_id: string
  monto: number
  moneda_id: string // Moneda del depósito
  concepto?: string
}

export interface PagarTCInput {
  billetera_tc_id: string
  monto_pagado: number
  monto_usado: number
  moneda_id: string // Moneda del pago
  billetera_pago_id?: string // Desde qué billetera se paga (opcional)
}

export interface CompartirBilleteraInput {
  billetera_id: string
  usuario_id: string // ID del usuario a invitar (debe estar en linked_users)
}

export interface BilleteraResponse extends Billetera {
  disponible?: number // Calculado: saldo_proyectado si > 0
  moneda?: Moneda // Información completa de la moneda principal
}

/**
 * SOBRES - DTOs
 */

export interface CrearSobreInput {
  nombre: string
  tipo: TipoSobre
  moneda_principal_id: string // CLP, USD, EUR, etc.
  is_compartido?: boolean
  max_participantes?: number
  categorias_ids?: string[] // IDs de categorías existentes
  nuevas_categorias?: string[] // Nombres para crear inline
  color?: string // Hex color: #FF0000
  emoji?: string // 📨, 💰, etc.
}

export interface ActualizarSobreInput {
  nombre?: string
  color?: string
  emoji?: string
}

export interface AsignarPresupuestoInput {
  sobre_id: string
  asignaciones: {
    billetera_id: string
    monto: number
    moneda_id: string // Moneda de la asignación
  }[]
}

export interface AumentarPresupuestoInput {
  sobre_id: string
  monto: number
  moneda_id: string // Moneda del aumento
  billetera_id: string
}

export interface DisminuirPresupuestoInput {
  sobre_id: string
  monto: number
  // No requiere moneda_id, usa la moneda del sobre
}

export interface TransferirPresupuestoInput {
  sobre_origen_id: string
  sobre_destino_id: string
  monto: number
  // No requiere moneda_id, validar que ambos sobres tengan misma moneda
}

export interface AgregarCategoriasInput {
  sobre_id: string
  categorias_ids?: string[]
  nuevas_categorias?: string[]
}

export interface InvitarASobreInput {
  sobre_id: string
  usuario_id: string // ID del usuario a invitar (debe estar en linked_users)
  rol?: RolSobreUsuario // OWNER, ADMIN, CONTRIBUTOR, VIEWER (default: CONTRIBUTOR)
}

export interface SobreResponse extends Sobre {
  disponible?: number // Calculado: presupuesto - gastado
  moneda?: Moneda // Información completa de la moneda principal
  categorias?: Categoria[]

  // Para compartidos
  participantes?: {
    usuario_id: string
    nombre: string
    rol: RolSobreUsuario
    presupuesto_asignado: number
    gastado: number
    disponible: number
  }[]

  // Mi tracking individual (en compartidos)
  mi_presupuesto?: number
  mi_gastado?: number
  mi_disponible?: number
}

/**
 * CATEGORÍAS - DTOs
 */

export interface CrearCategoriaInput {
  nombre: string
  color?: string // Hex color: #FF0000
  emoji?: string // 🍔, 🚗, 🏠, etc.
}

export interface ActualizarCategoriaInput {
  nombre?: string
  color?: string
  emoji?: string
}

export interface CategoriaResponse extends Categoria {
  total_gastado?: number // En todos los sobres
  sobres_ids?: string[] // Sobres que usan esta categoría
}

/**
 * SUBCATEGORÍAS - DTOs
 */

export interface CrearSubcategoriaInput {
  nombre: string
  categoria_id: string
  color?: string // Hex color: #FF0000
  emoji?: string // Logo o emoji
  imagen_url?: string // URL del logo de la marca
}

export interface ActualizarSubcategoriaInput {
  nombre?: string
  categoria_id?: string
  color?: string
  emoji?: string
  imagen_url?: string
}

export interface SubcategoriaResponse extends Subcategoria {
  total_gastado?: number
  categoria_nombre?: string
}

/**
 * TRANSACCIONES - DTOs
 */

export interface RegistrarGastoInput {
  monto: number
  moneda_id: string // Moneda del gasto
  billetera_id: string
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion?: string
  fecha?: string // ISO date
}

export interface RegistrarIngresoInput {
  monto: number
  moneda_id: string // Moneda del ingreso
  billetera_id: string
  concepto?: string
  fecha?: string
}

export interface ActualizarTransaccionInput {
  monto?: number
  moneda_id?: string
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  descripcion?: string
}

export interface TransaccionResponse extends Transaccion {
  billetera_nombre?: string
  sobre_nombre?: string
  categoria_nombre?: string
  subcategoria_nombre?: string
  usuario_nombre?: string
  moneda?: Moneda // Información completa de la moneda
  conversion_info?: TransaccionConversion // Info de conversión si aplica
}

/**
 * INGRESOS RECURRENTES - DTOs
 */

export interface CrearIngresoRecurrenteInput {
  nombre: string
  monto: number
  moneda_id: string // Moneda del ingreso recurrente
  frecuencia: FrecuenciaIngreso
  dia: number
  billetera_id: string
  auto_distribuir?: boolean
  distribucion?: {
    sobre_id: string
    monto: number
  }[]
}

export interface ActualizarIngresoRecurrenteInput {
  nombre?: string
  monto?: number
  moneda_id?: string
  dia?: number
  auto_distribuir?: boolean
  distribucion?: {
    sobre_id: string
    monto: number
  }[]
}

export interface IngresoRecurrenteResponse extends IngresoRecurrente {
  billetera_nombre?: string
  moneda?: Moneda // Información completa de la moneda
  distribucion_sobres?: {
    sobre_id: string
    sobre_nombre: string
    monto: number
  }[]
}

export interface EjecutarIngresoRecurrenteInput {
  ingreso_recurrente_id: string
  distribuir?: boolean // Si false, solo deposita sin distribuir
  sobres_seleccionados?: string[] // Para distribución parcial
}

/**
 * REPORTES - DTOs
 */

export interface ReporteBilleteraParams {
  billetera_id: string
  moneda_id?: string // Filtrar por moneda específica (opcional)
  fecha_inicio?: string
  fecha_fin?: string
}

export interface ReporteSobreParams {
  sobre_id: string
  fecha_inicio?: string
  fecha_fin?: string
}

export interface ReporteCategoriaParams {
  categoria_id: string
  sobre_id?: string // Si se especifica, solo ese sobre; si no, global
  moneda_id?: string // Filtrar por moneda específica (opcional)
  fecha_inicio?: string
  fecha_fin?: string
}

export interface ReporteSubcategoriaParams {
  subcategoria_id: string
  moneda_id?: string // Filtrar por moneda específica (opcional)
  fecha_inicio?: string
  fecha_fin?: string
}

export interface ReporteBilleteraResponse {
  billetera: BilleteraResponse
  transacciones: TransaccionResponse[]
  total_ingresos: number
  total_gastos: number
  saldo_inicial: number
  saldo_final: number
}

export interface ReporteSobreResponse {
  sobre: SobreResponse
  presupuesto_asignado: number
  gastado: number
  disponible: number
  por_categoria: {
    categoria_id: string
    categoria_nombre: string
    presupuestado: number
    gastado: number
    disponible: number
  }[]
  gastos: TransaccionResponse[]
}

export interface ReporteCategoriaResponse {
  categoria: CategoriaResponse
  total_gastado: number
  por_sobre?: {
    sobre_id: string
    sobre_nombre: string
    gastado: number
  }[]
  por_subcategoria: {
    subcategoria_id: string
    subcategoria_nombre: string
    gastado: number
  }[]
  gastos: TransaccionResponse[]
}

export interface ReporteSubcategoriaResponse {
  subcategoria: SubcategoriaResponse
  total_gastado: number
  por_sobre: {
    sobre_id: string
    sobre_nombre: string
    gastado: number
  }[]
  por_billetera: {
    billetera_id: string
    billetera_nombre: string
    gastado: number
  }[]
  gastos: TransaccionResponse[]
}

/**
 * DASHBOARD - DTOs
 */

export interface DashboardResponse {
  moneda_principal: Moneda // Moneda principal del usuario
  billeteras: {
    total_real: number // En moneda principal
    total_proyectado: number // En moneda principal
    billeteras: BilleteraResponse[]
  }
  sobres: {
    total_presupuestado: number // En moneda principal
    total_gastado: number // En moneda principal
    total_disponible: number // En moneda principal
    sobres: SobreResponse[]
  }
  mes_actual: {
    ingresos: number // En moneda principal
    gastos: number // En moneda principal
    balance: number // En moneda principal
    auto_aumentos: number // Total de auto-aumentos del mes en moneda principal
  }
  ultimas_transacciones: TransaccionResponse[]
}

/**
 * Respuestas genéricas de API
 */

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: any
}
