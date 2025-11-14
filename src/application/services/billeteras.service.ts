/**
 * Servicio de Billeteras
 *
 * Contiene la lógica de negocio para gestión de billeteras (wallets):
 * - Crear, actualizar, eliminar billeteras
 * - Consultar saldos y balance consolidado
 * - Transferencias entre billeteras
 * - Validación de reglas de negocio
 */

import { db } from '@/infrastructure/database/kysely'
import {
  createBilletera,
  findBilleteraById,
  findBilleterasByUser,
  updateBilletera,
  softDeleteBilletera,
  updateBilleteraSaldos,
} from '@/infrastructure/database/queries/billeteras.queries'
import { findMonedaById } from '@/infrastructure/database/queries/monedas.queries'
import { findUserConfig } from '@/infrastructure/database/queries/user-config.queries'
import { createTransaccion } from '@/infrastructure/database/queries/transacciones.queries'
import type { TipoBilletera, TipoBilleteraTransaccion } from '@/infrastructure/database/types'
import { appConfig } from '@/config/app.config'

/**
 * Helper: Registrar operación en billeteras_transacciones
 */
async function registrarBilleteraTransaccion(data: {
  billetera_id: string
  usuario_id: string
  tipo: TipoBilleteraTransaccion
  monto: number
  moneda_id: string
  billetera_origen_id?: string | null
  billetera_destino_id?: string | null
  saldo_real_post: number
  descripcion?: string | null
  fecha?: Date
}) {
  return db.insertInto('billeteras_transacciones')
    .values({
      billetera_id: data.billetera_id,
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      monto: data.monto,
      moneda_id: data.moneda_id,
      billetera_origen_id: data.billetera_origen_id || null,
      billetera_destino_id: data.billetera_destino_id || null,
      saldo_real_post: data.saldo_real_post,
      descripcion: data.descripcion || null,
      fecha: data.fecha || new Date(),
    })
    .execute()
}

/**
 * Datos para crear una billetera
 */
export interface CreateBilleteraInput {
  nombre: string
  tipo: TipoBilletera
  monedaPrincipalId?: string // Si no se pasa, usa la moneda principal del usuario
  saldoInicial?: number
  color?: string
  emoji?: string
  isCompartida?: boolean
  tasaInteres?: number | null
  userId: string
}

/**
 * Datos para actualizar una billetera
 */
export interface UpdateBilleteraInput {
  nombre?: string
  tipo?: TipoBilletera
  color?: string
  emoji?: string
  isCompartida?: boolean
  tasaInteres?: number | null
}

/**
 * Datos para transferencia entre billeteras
 */
export interface TransferenciaBilleterasInput {
  billeteraOrigenId: string
  billeteraDestinoId: string
  monto: number
  descripcion?: string
  userId: string
}

/**
 * Datos para depositar o retirar
 */
export interface DepositarORetirarInput {
  billeteraId: string
  monto: number
  tipo: 'DEPOSITO' | 'RETIRO'
  descripcion?: string
  userId: string
}

/**
 * Resultado de operación
 */
export interface BilleteraResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Crear una nueva billetera
 */
export async function crearBilletera(
  input: CreateBilleteraInput
): Promise<BilleteraResult> {
  try {
    // Si no se especifica moneda, usar la moneda principal del usuario
    let monedaPrincipalId: string = input.monedaPrincipalId || ''

    if (!monedaPrincipalId) {
      const userConfig = await findUserConfig(input.userId)
      if (userConfig && userConfig.moneda_principal_id) {
        monedaPrincipalId = userConfig.moneda_principal_id
      } else {
        // Si no tiene config, usar la primera moneda activa como default
        const monedasActivas = await db.selectFrom('monedas')
          .selectAll()
          .where('activa', '=', true)
          .orderBy('orden', 'asc')
          .limit(1)
          .execute()

        if (monedasActivas.length === 0) {
          return {
            success: false,
            error: 'No hay monedas disponibles en el sistema',
          }
        }
        monedaPrincipalId = monedasActivas[0].id
      }
    }

    // Validar que la moneda existe
    const moneda = await findMonedaById(monedaPrincipalId as string)
    if (!moneda) {
      return {
        success: false,
        error: 'Moneda no válida',
      }
    }

    // Validar nombre (no vacío)
    if (!input.nombre || input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre de la billetera es requerido',
      }
    }

    // Validar tipo de billetera
    const tiposValidos: TipoBilletera[] = [
      'DEBITO',
      'CREDITO',
      'EFECTIVO',
      'AHORRO',
      'INVERSION',
      'PRESTAMO',
    ]
    if (!tiposValidos.includes(input.tipo)) {
      return {
        success: false,
        error: 'Tipo de billetera no válido',
      }
    }

    const saldoInicial = input.saldoInicial || 0

    // Crear billetera
    const billetera = await createBilletera({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      moneda_principal_id: monedaPrincipalId,
      saldo_real: saldoInicial,
      saldo_proyectado: saldoInicial,
      color: input.color,
      emoji: input.emoji,
      is_compartida: input.isCompartida || false,
      tasa_interes: input.tasaInteres || null,
      usuario_id: input.userId,
    })

    // Si hay saldo inicial, crear transacción de ajuste
    if (saldoInicial !== 0) {
      await createTransaccion({
        monto: Math.abs(saldoInicial),
        moneda_id: monedaPrincipalId,
        billetera_id: billetera.id,
        tipo: saldoInicial > 0 ? 'DEPOSITO' : 'AJUSTE',
        descripcion: 'Saldo inicial',
        fecha: new Date(),
        usuario_id: input.userId,
      })
    }

    return {
      success: true,
      data: billetera,
    }
  } catch (error) {
    console.error('Error al crear billetera:', error)
    return {
      success: false,
      error: 'Error al crear la billetera',
    }
  }
}

/**
 * Obtener todas las billeteras de un usuario
 */
export async function obtenerBilleterasUsuario(
  userId: string
): Promise<BilleteraResult> {
  try {
    const billeteras = await findBilleterasByUser(userId)
    return {
      success: true,
      data: billeteras,
    }
  } catch (error) {
    console.error('Error al obtener billeteras:', error)
    return {
      success: false,
      error: 'Error al obtener las billeteras',
    }
  }
}

/**
 * Obtener una billetera por ID
 */
export async function obtenerBilletera(
  billeteraId: string,
  userId: string
): Promise<BilleteraResult> {
  try {
    const billetera = await findBilleteraById(billeteraId)

    if (!billetera) {
      return {
        success: false,
        error: 'Billetera no encontrada',
      }
    }

    // Verificar que la billetera pertenece al usuario
    if (billetera.usuario_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a esta billetera',
      }
    }

    return {
      success: true,
      data: billetera,
    }
  } catch (error) {
    console.error('Error al obtener billetera:', error)
    return {
      success: false,
      error: 'Error al obtener la billetera',
    }
  }
}

/**
 * Actualizar una billetera
 */
export async function actualizarBilletera(
  billeteraId: string,
  userId: string,
  input: UpdateBilleteraInput
): Promise<BilleteraResult> {
  try {
    // Verificar que la billetera existe y pertenece al usuario
    const billeteraResult = await obtenerBilletera(billeteraId, userId)
    if (!billeteraResult.success) {
      return billeteraResult
    }

    // Validar nombre si se proporciona
    if (input.nombre !== undefined && input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre no puede estar vacío',
      }
    }

    const updateData: any = {}
    if (input.nombre) updateData.nombre = input.nombre.trim()
    if (input.tipo !== undefined) updateData.tipo = input.tipo
    if (input.color !== undefined) updateData.color = input.color
    if (input.emoji !== undefined) updateData.emoji = input.emoji
    if (input.isCompartida !== undefined) updateData.is_compartida = input.isCompartida
    if (input.tasaInteres !== undefined) updateData.tasa_interes = input.tasaInteres

    const billetera = await updateBilletera(billeteraId, updateData)

    return {
      success: true,
      data: billetera,
    }
  } catch (error) {
    console.error('Error al actualizar billetera:', error)
    return {
      success: false,
      error: 'Error al actualizar la billetera',
    }
  }
}

/**
 * Eliminar una billetera (soft delete)
 */
export async function eliminarBilletera(
  billeteraId: string,
  userId: string
): Promise<BilleteraResult> {
  try {
    // Verificar que la billetera existe y pertenece al usuario
    const billeteraResult = await obtenerBilletera(billeteraId, userId)
    if (!billeteraResult.success) {
      return billeteraResult
    }

    const billetera = billeteraResult.data

    // Si la billetera tiene saldo, crear un registro de retiro para UNDECLARED
    // para descontar el saldo de todos los sobres asociados
    if (billetera.saldo_real !== 0) {
      await transferirEntreBilleteras({
        billeteraOrigenId: billeteraId,
        billeteraDestinoId: 'UNDECLARED',
        monto: Math.abs(Number(billetera.saldo_real)),
        descripcion: `Retiro automático al eliminar billetera: ${billetera.nombre}`,
        userId,
      })
    }

    await softDeleteBilletera(billeteraId)

    return {
      success: true,
      data: { message: 'Billetera eliminada correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar billetera:', error)
    return {
      success: false,
      error: 'Error al eliminar la billetera',
    }
  }
}

/**
 * Transferir dinero entre billeteras
 * Soporta "UNDECLARED" como origen o destino para registros de ajuste manual
 */
export async function transferirEntreBilleteras(
  input: TransferenciaBilleterasInput
): Promise<BilleteraResult> {
  try {
    const { billeteraOrigenId, billeteraDestinoId, monto, descripcion, userId } = input

    // Validar monto
    if (monto <= 0) {
      return {
        success: false,
        error: 'El monto debe ser mayor a cero',
      }
    }

    // Verificar billetera origen (si no es UNDECLARED)
    let billeteraOrigen: any = null
    let monedaId = ''

    if (billeteraOrigenId !== 'UNDECLARED') {
      const origenResult = await obtenerBilletera(billeteraOrigenId, userId)
      if (!origenResult.success) {
        return {
          success: false,
          error: 'Billetera de origen no válida',
        }
      }
      billeteraOrigen = origenResult.data
      monedaId = billeteraOrigen.moneda_principal_id
    } else {
      // Si es UNDECLARED, obtener la moneda del destino
      if (billeteraDestinoId !== 'UNDECLARED') {
        const destinoResult = await obtenerBilletera(billeteraDestinoId, userId)
        if (!destinoResult.success) {
          return {
            success: false,
            error: 'Billetera de destino no válida',
          }
        }
        monedaId = destinoResult.data.moneda_principal_id
      } else {
        // Si ambas son UNDECLARED, usar la moneda principal del usuario
        const userConfig = await findUserConfig(userId)
        monedaId = userConfig?.moneda_principal_id || 'CLP'
      }
    }

    // Verificar billetera destino (si no es UNDECLARED)
    let billeteraDestino: any = null

    if (billeteraDestinoId !== 'UNDECLARED') {
      const destinoResult = await obtenerBilletera(billeteraDestinoId, userId)
      if (!destinoResult.success) {
        return {
          success: false,
          error: 'Billetera de destino no válida',
        }
      }
      billeteraDestino = destinoResult.data

      // Si origen no es UNDECLARED, verificar misma moneda
      if (billeteraOrigen && billeteraOrigen.moneda_principal_id !== billeteraDestino.moneda_principal_id) {
        return {
          success: false,
          error: 'Las billeteras deben usar la misma moneda para transferencias',
        }
      }
    }

    // Verificar que no sean iguales (excepto si es UNDECLARED)
    if (billeteraOrigenId !== 'UNDECLARED' && billeteraDestinoId !== 'UNDECLARED' && billeteraOrigenId === billeteraDestinoId) {
      return {
        success: false,
        error: 'No puedes transferir a la misma billetera',
      }
    }

    // Crear transacción de salida (origen)
    if (billeteraOrigenId !== 'UNDECLARED') {
      const transactionData: any = {
        monto: monto,
        moneda_id: monedaId,
        billetera_id: billeteraOrigenId,
        tipo: 'TRANSFERENCIA',
        descripcion: descripcion || (billeteraDestino ? `Transferencia a ${billeteraDestino.nombre}` : 'Transferencia a destino no declarado'),
        fecha: new Date(),
        usuario_id: userId,
      }

      // Solo agregar billetera_destino_id si es una billetera real
      if (billeteraDestinoId !== 'UNDECLARED') {
        transactionData.billetera_destino_id = billeteraDestinoId
      }

      await createTransaccion(transactionData)

      // Actualizar saldo origen
      const nuevoSaldoOrigen = Number(billeteraOrigen.saldo_real) - monto
      const nuevoSaldoProyectadoOrigen = Number(billeteraOrigen.saldo_proyectado) - monto
      await updateBilleteraSaldos(billeteraOrigenId, nuevoSaldoOrigen, nuevoSaldoProyectadoOrigen)
    }

    // Crear transacción de entrada (destino)
    if (billeteraDestinoId !== 'UNDECLARED') {
      await createTransaccion({
        monto: monto,
        moneda_id: monedaId,
        billetera_id: billeteraDestinoId,
        tipo: billeteraOrigenId === 'UNDECLARED' ? 'DEPOSITO' : 'DEPOSITO',
        descripcion: descripcion || (billeteraOrigen ? `Transferencia desde ${billeteraOrigen.nombre}` : 'Transferencia desde origen no declarado'),
        fecha: new Date(),
        usuario_id: userId,
      })

      // Actualizar saldo destino
      const nuevoSaldoDestino = Number(billeteraDestino.saldo_real) + monto
      const nuevoSaldoProyectadoDestino = Number(billeteraDestino.saldo_proyectado) + monto
      await updateBilleteraSaldos(billeteraDestinoId, nuevoSaldoDestino, nuevoSaldoProyectadoDestino)
    }

    return {
      success: true,
      data: { message: 'Ajuste registrado correctamente' },
    }
  } catch (error) {
    console.error('Error al transferir entre billeteras:', error)
    return {
      success: false,
      error: 'Error al realizar el ajuste',
    }
  }
}

/**
 * Obtener balance consolidado de todas las billeteras del usuario
 */
export async function obtenerBalanceConsolidado(
  userId: string
): Promise<BilleteraResult> {
  try {
    const billeteras = await findBilleterasByUser(userId)

    // Agrupar por moneda
    const balancePorMoneda: Record<
      string,
      {
        moneda_id: string
        saldo_real_total: number
        saldo_proyectado_total: number
        billeteras: number
      }
    > = {}

    for (const billetera of billeteras) {
      const monedaId = billetera.moneda_principal_id

      if (!balancePorMoneda[monedaId]) {
        balancePorMoneda[monedaId] = {
          moneda_id: monedaId,
          saldo_real_total: 0,
          saldo_proyectado_total: 0,
          billeteras: 0,
        }
      }

      balancePorMoneda[monedaId].saldo_real_total += Number(billetera.saldo_real)
      balancePorMoneda[monedaId].saldo_proyectado_total += Number(billetera.saldo_proyectado)
      balancePorMoneda[monedaId].billeteras += 1
    }

    return {
      success: true,
      data: {
        total_billeteras: billeteras.length,
        balance_por_moneda: Object.values(balancePorMoneda),
      },
    }
  } catch (error) {
    console.error('Error al obtener balance consolidado:', error)
    return {
      success: false,
      error: 'Error al obtener el balance',
    }
  }
}

/**
 * Depositar o retirar dinero de una billetera
 */
export async function depositarORetirar(
  input: DepositarORetirarInput
): Promise<BilleteraResult> {
  try {
    const { billeteraId, monto, tipo, descripcion, userId } = input

    // Validar monto
    if (monto <= 0) {
      return {
        success: false,
        error: 'El monto debe ser mayor a cero',
      }
    }

    // Validar tipo
    if (!['DEPOSITO', 'RETIRO'].includes(tipo)) {
      return {
        success: false,
        error: 'Tipo debe ser DEPOSITO o RETIRO',
      }
    }

    // Verificar que la billetera existe y pertenece al usuario
    const billetera = await findBilleteraById(billeteraId)
    if (!billetera) {
      return {
        success: false,
        error: 'Billetera no encontrada',
      }
    }
    if (billetera.usuario_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para usar esta billetera',
      }
    }

    // Validar saldo si es retiro
    if (tipo === 'RETIRO' && Number(billetera.saldo_real) < monto) {
      return {
        success: false,
        error: 'Saldo insuficiente para el retiro',
      }
    }

    // Calcular nuevo saldo
    let nuevoSaldoReal = Number(billetera.saldo_real)
    let nuevoSaldoProyectado = Number(billetera.saldo_proyectado)

    if (tipo === 'DEPOSITO') {
      nuevoSaldoReal += monto
      nuevoSaldoProyectado += monto
    } else if (tipo === 'RETIRO') {
      nuevoSaldoReal -= monto
      nuevoSaldoProyectado -= monto
    }

    // Actualizar saldo de billetera
    await updateBilleteraSaldos(billeteraId, nuevoSaldoReal, nuevoSaldoProyectado)

    // Registrar operación en billeteras_transacciones
    await registrarBilleteraTransaccion({
      billetera_id: billeteraId,
      usuario_id: userId,
      tipo: tipo,
      monto,
      moneda_id: billetera.moneda_principal_id,
      saldo_real_post: nuevoSaldoReal,
      descripcion: descripcion || null,
    })

    return {
      success: true,
      data: { message: 'Operación registrada correctamente' },
    }
  } catch (error) {
    console.error('Error al registrar operación:', error)
    return {
      success: false,
      error: 'Error al registrar la operación',
    }
  }
}
