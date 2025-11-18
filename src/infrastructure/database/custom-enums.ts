/**
 * Custom Enums - Financial System
 *
 * Estos enums NO se generan automáticamente con Kysely.
 * Se mantienen aquí de forma manual y no se sobrescriben con npm run db:types
 */

// Tipos de moneda
export type TipoMoneda = 'FIAT' | 'INDICE' | 'CRYPTO'

// Tipos de billetera (wallet)
export type TipoBilletera = 'DEBITO' | 'CREDITO' | 'EFECTIVO' | 'AHORRO' | 'INVERSION' | 'PRESTAMO'

// Tipos de transacción en billetera
export type TipoBilleteraTransaccion =
  | 'CREACION'
  | 'DEPOSITO'
  | 'RETIRO'
  | 'TRANSFERENCIA'
  | 'GASTO'
  | 'ASIGNACION_SOBRE'
  | 'DEVOLUCION_SOBRE'
  | 'AJUSTE'

// Tipos de sobre (envelope budgeting)
export type TipoSobre = 'GASTO' | 'AHORRO' | 'DEUDA'

// Tipos de transacción
export type TipoTransaccion = 'GASTO' | 'INGRESO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'PAGO_TC' | 'AJUSTE'

// Frecuencia de ingresos
export type FrecuenciaIngreso = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL'

// Estado de ingresos recurrentes
export type EstadoIngresoRecurrente = 'ACTIVO' | 'PAUSADO' | 'ELIMINADO'

// Tipo de asignación presupuesto
export type TipoAsignacionPresupuesto = 'INICIAL' | 'AUMENTO' | 'DISMINUCION' | 'TRANSFERENCIA'

// Estado de invitación sobre
export type EstadoInvitacionSobre = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA'

// Rol de usuario en sobre
export type RolSobreUsuario = 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'

// Tipo de período
export type TipoPeriodo = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'CUSTOM'
