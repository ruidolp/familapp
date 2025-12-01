/**
 * Servicio de Presupuestos
 *
 * Gestión de presupuestos configurables por sobre con:
 * - Enable/Disable de presupuesto por sobre
 * - Monto global del sobre
 * - Cuotas opcionales por categoría (soft limits)
 * - Registro de ajustes para análisis
 * - Sugerencias basadas en periodo anterior
 */

import {
  findPresupuestoByPeriodo,
  upsertPresupuesto,
  findCuotasByPresupuesto,
  upsertCuotaCategoria,
  deleteCuotaCategoria,
  registrarAjustePresupuesto,
  findAjustesByPeriodo,
  findGastosResumenByPeriodo,
  findSugerenciaPresupuesto,
  findSobreById,
} from '@/infrastructure/database/queries/sobres.queries'
import { getCurrentBudgetCycle } from '@/infrastructure/utils/budget-cycle'
import { db } from '@/infrastructure/database/kysely'

export interface PresupuestoResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Obtener configuración completa de presupuesto (config + cuotas + gastos)
 */
export async function obtenerPresupuestoCompleto(
  sobreId: string,
  userId: string,
  periodoYear?: number,
  periodoMonth?: number
): Promise<PresupuestoResult> {
  try {
    // Validar sobre y permisos
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // TODO: Validar permisos de usuario (propietario o participante)

    // Periodo actual si no se especifica
    const today = new Date()
    const year = periodoYear ?? today.getFullYear()
    const month = periodoMonth ?? (today.getMonth() + 1)

    // Obtener configuración de presupuesto
    const config = await findPresupuestoByPeriodo(sobreId, year, month)

    // Si no hay configuración, retornar default (disabled)
    if (!config) {
      return {
        success: true,
        data: {
          presupuesto_enabled: false,
          monto_global: 0,
          cuotas: [],
          gastos: [],
        },
      }
    }

    // Obtener cuotas de categorías
    const cuotas = await findCuotasByPresupuesto(config.id)

    // Obtener gastos del periodo (desde agregación)
    const gastos = await findGastosResumenByPeriodo(sobreId, year, month)

    return {
      success: true,
      data: {
        id: config.id,
        presupuesto_enabled: config.presupuesto_enabled,
        monto_global: Number(config.monto_global),
        cuotas: cuotas.map((c) => ({
          id: c.id,
          categoria_id: c.categoria_id,
          categoria_nombre: c.categoria_nombre,
          categoria_emoji: c.categoria_emoji,
          categoria_color: c.categoria_color,
          monto_cuota: Number(c.monto_cuota),
        })),
        gastos: gastos.map((g) => ({
          categoria_id: g.categoria_id,
          categoria_nombre: g.categoria_nombre,
          categoria_emoji: g.categoria_emoji,
          categoria_color: g.categoria_color,
          total_gastado: Number(g.total_gastado),
          cantidad_transacciones: g.cantidad_transacciones,
        })),
        periodo: { year, month },
      },
    }
  } catch (error) {
    console.error('Error al obtener presupuesto completo:', error)
    return { success: false, error: 'Error al obtener configuración de presupuesto' }
  }
}

/**
 * Activar/Desactivar presupuesto para un sobre
 */
export async function togglePresupuesto(
  sobreId: string,
  userId: string,
  enabled: boolean,
  montoGlobal?: number
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Obtener configuración actual
    const configActual = await findPresupuestoByPeriodo(sobreId, year, month)

    // Crear o actualizar configuración
    const config = await upsertPresupuesto({
      sobre_id: sobreId,
      periodo_year: year,
      periodo_month: month,
      presupuesto_enabled: enabled,
      monto_global: montoGlobal ?? configActual?.monto_global ?? 0,
    })

    // Registrar ajuste si cambió el estado
    if (!configActual || configActual.presupuesto_enabled !== enabled) {
      await registrarAjustePresupuesto({
        sobre_id: sobreId,
        periodo_year: year,
        periodo_month: month,
        tipo_ajuste: enabled ? 'AUMENTO_GLOBAL' : 'DISMINUCION_GLOBAL',
        campo: 'enabled',
        valor_anterior: configActual?.presupuesto_enabled ? 1 : 0,
        valor_nuevo: enabled ? 1 : 0,
        usuario_id: userId,
        motivo: enabled ? 'Presupuesto activado' : 'Presupuesto desactivado',
      })
    }

    return {
      success: true,
      data: {
        id: config.id,
        presupuesto_enabled: config.presupuesto_enabled,
        monto_global: Number(config.monto_global),
      },
    }
  } catch (error) {
    console.error('Error al toggle presupuesto:', error)
    return { success: false, error: 'Error al cambiar estado del presupuesto' }
  }
}

/**
 * Actualizar monto global del presupuesto
 */
export async function actualizarMontoGlobal(
  sobreId: string,
  userId: string,
  nuevoMonto: number
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Obtener configuración actual
    const configActual = await findPresupuestoByPeriodo(sobreId, year, month)
    const montoAnterior = configActual?.monto_global ?? 0

    // Actualizar configuración
    const config = await upsertPresupuesto({
      sobre_id: sobreId,
      periodo_year: year,
      periodo_month: month,
      presupuesto_enabled: configActual?.presupuesto_enabled ?? true,
      monto_global: nuevoMonto,
    })

    // Registrar ajuste
    const tipoAjuste = nuevoMonto > montoAnterior ? 'AUMENTO_GLOBAL' : 'DISMINUCION_GLOBAL'
    await registrarAjustePresupuesto({
      sobre_id: sobreId,
      periodo_year: year,
      periodo_month: month,
      tipo_ajuste: tipoAjuste,
      campo: 'global',
      valor_anterior: Number(montoAnterior),
      valor_nuevo: nuevoMonto,
      usuario_id: userId,
      motivo: 'Ajuste manual de monto global',
    })

    return {
      success: true,
      data: {
        id: config.id,
        monto_global: Number(config.monto_global),
      },
    }
  } catch (error) {
    console.error('Error al actualizar monto global:', error)
    return { success: false, error: 'Error al actualizar monto global' }
  }
}

/**
 * Configurar cuota de categoría
 */
export async function configurarCuotaCategoria(
  sobreId: string,
  userId: string,
  categoriaId: string,
  montoCuota: number
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Asegurar que existe configuración de presupuesto
    let config = await findPresupuestoByPeriodo(sobreId, year, month)
    if (!config) {
      config = await upsertPresupuesto({
        sobre_id: sobreId,
        periodo_year: year,
        periodo_month: month,
        presupuesto_enabled: true,
        monto_global: 0,
      })
    }

    // Buscar cuota actual
    const cuotaActual = await db
      .selectFrom('sobres_categorias_cuotas')
      .selectAll()
      .where('presupuesto_id', '=', config.id)
      .where('categoria_id', '=', categoriaId)
      .executeTakeFirst()

    // Crear o actualizar cuota
    const cuota = await upsertCuotaCategoria({
      presupuesto_id: config.id,
      categoria_id: categoriaId,
      monto_cuota: montoCuota,
    })

    // Registrar ajuste
    const esNueva = !cuotaActual
    const tipoAjuste = esNueva
      ? 'NUEVA_CUOTA'
      : montoCuota > Number(cuotaActual.monto_cuota)
      ? 'AUMENTO_CUOTA_CATEGORIA'
      : 'DISMINUCION_CUOTA_CATEGORIA'

    await registrarAjustePresupuesto({
      sobre_id: sobreId,
      periodo_year: year,
      periodo_month: month,
      tipo_ajuste: tipoAjuste,
      campo: categoriaId,
      categoria_id: categoriaId,
      valor_anterior: cuotaActual ? Number(cuotaActual.monto_cuota) : null,
      valor_nuevo: montoCuota,
      usuario_id: userId,
      motivo: esNueva ? 'Nueva cuota creada' : 'Ajuste de cuota existente',
    })

    return {
      success: true,
      data: {
        id: cuota.id,
        categoria_id: cuota.categoria_id,
        monto_cuota: Number(cuota.monto_cuota),
      },
    }
  } catch (error) {
    console.error('Error al configurar cuota de categoría:', error)
    return { success: false, error: 'Error al configurar cuota' }
  }
}

/**
 * Eliminar cuota de categoría
 */
export async function eliminarCuotaCategoria(
  sobreId: string,
  userId: string,
  categoriaId: string
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Obtener configuración
    const config = await findPresupuestoByPeriodo(sobreId, year, month)
    if (!config) {
      return { success: false, error: 'No hay configuración de presupuesto' }
    }

    // Buscar cuota actual
    const cuotaActual = await db
      .selectFrom('sobres_categorias_cuotas')
      .selectAll()
      .where('presupuesto_id', '=', config.id)
      .where('categoria_id', '=', categoriaId)
      .executeTakeFirst()

    if (!cuotaActual) {
      return { success: false, error: 'Cuota no encontrada' }
    }

    // Eliminar cuota
    await deleteCuotaCategoria(config.id, categoriaId)

    // Registrar ajuste
    await registrarAjustePresupuesto({
      sobre_id: sobreId,
      periodo_year: year,
      periodo_month: month,
      tipo_ajuste: 'ELIMINAR_CUOTA',
      campo: categoriaId,
      categoria_id: categoriaId,
      valor_anterior: Number(cuotaActual.monto_cuota),
      valor_nuevo: 0,
      usuario_id: userId,
      motivo: 'Cuota eliminada',
    })

    return { success: true, data: { message: 'Cuota eliminada correctamente' } }
  } catch (error) {
    console.error('Error al eliminar cuota:', error)
    return { success: false, error: 'Error al eliminar cuota' }
  }
}

/**
 * Obtener sugerencia de presupuesto basada en periodo anterior
 */
export async function obtenerSugerenciaPresupuesto(
  sobreId: string,
  userId: string
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Obtener gastos del periodo anterior
    const sugerencias = await findSugerenciaPresupuesto(sobreId, year, month)

    if (sugerencias.length === 0) {
      return {
        success: true,
        data: {
          mensaje: 'No hay datos del periodo anterior para generar sugerencias',
          sugerencias: [],
        },
      }
    }

    // Calcular monto global sugerido (suma de todas las categorías)
    const montoGlobalSugerido = sugerencias.reduce(
      (acc, s) => acc + Number(s.total_gastado),
      0
    )

    return {
      success: true,
      data: {
        monto_global_sugerido: Math.ceil(montoGlobalSugerido),
        categorias: sugerencias.map((s) => ({
          categoria_id: s.categoria_id,
          categoria_nombre: s.categoria_nombre,
          categoria_emoji: s.categoria_emoji,
          categoria_color: s.categoria_color,
          monto_sugerido: Math.ceil(Number(s.total_gastado)),
          transacciones_periodo_anterior: s.cantidad_transacciones,
        })),
      },
    }
  } catch (error) {
    console.error('Error al obtener sugerencia:', error)
    return { success: false, error: 'Error al generar sugerencia' }
  }
}

/**
 * Obtener estadísticas de ajustes de presupuesto
 */
export async function obtenerStatsAjustes(
  sobreId: string,
  userId: string,
  periodoYear?: number,
  periodoMonth?: number
): Promise<PresupuestoResult> {
  try {
    // Validar sobre
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return { success: false, error: 'Sobre no encontrado' }
    }

    // Periodo actual si no se especifica
    const today = new Date()
    const year = periodoYear ?? today.getFullYear()
    const month = periodoMonth ?? (today.getMonth() + 1)

    // Obtener ajustes del periodo
    const ajustes = await findAjustesByPeriodo(sobreId, year, month)

    // Calcular stats
    const totalAjustes = ajustes.length
    const aumentos = ajustes.filter((a) => Number(a.diferencia) > 0)
    const disminuciones = ajustes.filter((a) => Number(a.diferencia) < 0)

    const totalAumentos = aumentos.reduce((acc, a) => acc + Number(a.diferencia), 0)
    const totalDisminuciones = Math.abs(
      disminuciones.reduce((acc, a) => acc + Number(a.diferencia), 0)
    )

    return {
      success: true,
      data: {
        periodo: { year, month },
        total_ajustes: totalAjustes,
        cantidad_aumentos: aumentos.length,
        cantidad_disminuciones: disminuciones.length,
        monto_total_aumentos: totalAumentos,
        monto_total_disminuciones: totalDisminuciones,
        ajustes: ajustes.map((a) => ({
          tipo: a.tipo_ajuste,
          campo: a.campo,
          categoria_id: a.categoria_id,
          valor_anterior: Number(a.valor_anterior),
          valor_nuevo: Number(a.valor_nuevo),
          diferencia: Number(a.diferencia),
          fecha: a.fecha_ajuste,
          motivo: a.motivo,
        })),
      },
    }
  } catch (error) {
    console.error('Error al obtener stats de ajustes:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}
