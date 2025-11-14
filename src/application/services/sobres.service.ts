/**
 * Servicio de Sobres (Envelopes)
 *
 * Contiene la lógica de negocio para gestión de sobres/presupuestos:
 * - Crear, actualizar, eliminar sobres
 * - Gestión de participantes (sobres compartidos)
 * - Vincular categorías a sobres
 * - Consultar presupuesto y gastos
 * - Validación de reglas de negocio
 */

import {
  createSobre,
  findSobreById,
  findSobresByUser,
  updateSobre,
  softDeleteSobre,
  addParticipanteToSobre,
  removeParticipanteFromSobre,
  updateParticipanteTracking,
  findParticipantesBySobre,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  linkCategoriasToSobre,
  unlinkCategoriaFromSobre,
  findCategoriasBySobre,
} from '@/infrastructure/database/queries/categorias.queries'
import type { TipoSobre, RolSobreUsuario } from '@/infrastructure/database/types'

/**
 * Datos para crear un sobre
 */
export interface CreateSobreInput {
  nombre: string
  tipo: TipoSobre
  presupuestoAsignado: number
  monedaPrincipalId?: string
  color?: string
  emoji?: string
  userId: string
}

/**
 * Datos para actualizar un sobre
 */
export interface UpdateSobreInput {
  nombre?: string
  presupuestoAsignado?: number
  color?: string
  emoji?: string
}

/**
 * Datos para agregar participante
 */
export interface AddParticipanteInput {
  sobreId: string
  userId: string
  participanteId: string
  rol: RolSobreUsuario
  presupuestoAsignado?: number
}

/**
 * Resultado de operación
 */
export interface SobreResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Crear un nuevo sobre
 */
export async function crearSobre(
  input: CreateSobreInput
): Promise<SobreResult> {
  try {
    // Validar nombre (no vacío)
    if (!input.nombre || input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre del sobre es requerido',
      }
    }

    // Validar tipo de sobre
    const tiposValidos: TipoSobre[] = ['GASTO', 'AHORRO', 'DEUDA']
    if (!tiposValidos.includes(input.tipo)) {
      return {
        success: false,
        error: 'Tipo de sobre no válido',
      }
    }

    // Validar presupuesto
    if (input.presupuestoAsignado < 0) {
      return {
        success: false,
        error: 'El presupuesto no puede ser negativo',
      }
    }

    // Validar que se proporcione moneda
    if (!input.monedaPrincipalId) {
      return {
        success: false,
        error: 'monedaPrincipalId es requerido',
      }
    }

    // Crear sobre
    const sobre = await createSobre({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      moneda_principal_id: input.monedaPrincipalId,
      presupuesto_asignado: input.presupuestoAsignado,
      color: input.color,
      emoji: input.emoji,
      is_compartido: false,
      max_participantes: 10, // Este es un límite de negocio, no un hardcode de config
      usuario_id: input.userId,
    })

    // Agregar al creador como OWNER
    await addParticipanteToSobre(sobre.id, input.userId, 'OWNER', input.presupuestoAsignado)

    return {
      success: true,
      data: sobre,
    }
  } catch (error) {
    console.error('Error al crear sobre:', error)
    return {
      success: false,
      error: 'Error al crear el sobre',
    }
  }
}

/**
 * Obtener todos los sobres del usuario
 */
export async function obtenerSobresUsuario(
  userId: string
): Promise<SobreResult> {
  try {
    const sobres = await findSobresByUser(userId)
    return {
      success: true,
      data: sobres,
    }
  } catch (error) {
    console.error('Error al obtener sobres:', error)
    return {
      success: false,
      error: 'Error al obtener los sobres',
    }
  }
}

/**
 * Obtener un sobre por ID
 */
export async function obtenerSobre(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    const sobre = await findSobreById(sobreId)

    if (!sobre) {
      return {
        success: false,
        error: 'Sobre no encontrado',
      }
    }

    // Verificar que el usuario tiene acceso (es owner o participante)
    const participantes = await findParticipantesBySobre(sobreId)
    const tieneAcceso = participantes.some((p: any) => p.usuario_id === userId)

    if (!tieneAcceso) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a este sobre',
      }
    }

    return {
      success: true,
      data: sobre,
    }
  } catch (error) {
    console.error('Error al obtener sobre:', error)
    return {
      success: false,
      error: 'Error al obtener el sobre',
    }
  }
}

/**
 * Actualizar un sobre
 */
export async function actualizarSobre(
  sobreId: string,
  userId: string,
  input: UpdateSobreInput
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    // Verificar que el usuario es OWNER o ADMIN
    const participantes = await findParticipantesBySobre(sobreId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    if (!participante || (participante.rol !== 'OWNER' && participante.rol !== 'ADMIN')) {
      return {
        success: false,
        error: 'No tienes permiso para editar este sobre',
      }
    }

    // Validar nombre si se proporciona
    if (input.nombre !== undefined && input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre no puede estar vacío',
      }
    }

    // Validar presupuesto si se proporciona
    if (input.presupuestoAsignado !== undefined && input.presupuestoAsignado < 0) {
      return {
        success: false,
        error: 'El presupuesto no puede ser negativo',
      }
    }

    const updateData: any = {}
    if (input.nombre) updateData.nombre = input.nombre.trim()
    if (input.presupuestoAsignado !== undefined)
      updateData.presupuesto_asignado = input.presupuestoAsignado
    if (input.color !== undefined) updateData.color = input.color
    if (input.emoji !== undefined) updateData.emoji = input.emoji

    const sobre = await updateSobre(sobreId, updateData)

    return {
      success: true,
      data: sobre,
    }
  } catch (error) {
    console.error('Error al actualizar sobre:', error)
    return {
      success: false,
      error: 'Error al actualizar el sobre',
    }
  }
}

/**
 * Eliminar un sobre (soft delete)
 */
export async function eliminarSobre(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesBySobre(sobreId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    if (!participante || participante.rol !== 'OWNER') {
      return {
        success: false,
        error: 'Solo el propietario puede eliminar el sobre',
      }
    }

    await softDeleteSobre(sobreId)

    return {
      success: true,
      data: { message: 'Sobre eliminado correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar sobre:', error)
    return {
      success: false,
      error: 'Error al eliminar el sobre',
    }
  }
}

/**
 * Agregar participante a un sobre
 */
export async function agregarParticipante(
  input: AddParticipanteInput
): Promise<SobreResult> {
  try {
    const { sobreId, userId, participanteId, rol, presupuestoAsignado } = input

    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    // Verificar que el usuario es OWNER o ADMIN
    const participantes = await findParticipantesBySobre(sobreId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    if (!participante || (participante.rol !== 'OWNER' && participante.rol !== 'ADMIN')) {
      return {
        success: false,
        error: 'No tienes permiso para agregar participantes',
      }
    }

    // Verificar que el participante no existe ya
    const yaExiste = participantes.some((p: any) => p.usuario_id === participanteId)
    if (yaExiste) {
      return {
        success: false,
        error: 'El usuario ya es participante de este sobre',
      }
    }

    // Validar rol
    const rolesValidos: RolSobreUsuario[] = ['OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER']
    if (!rolesValidos.includes(rol)) {
      return {
        success: false,
        error: 'Rol no válido',
      }
    }

    // No permitir múltiples OWNER
    if (rol === 'OWNER') {
      return {
        success: false,
        error: 'Solo puede haber un propietario por sobre',
      }
    }

    await addParticipanteToSobre(
      sobreId,
      participanteId,
      rol,
      presupuestoAsignado || 0
    )

    return {
      success: true,
      data: { message: 'Participante agregado correctamente' },
    }
  } catch (error) {
    console.error('Error al agregar participante:', error)
    return {
      success: false,
      error: 'Error al agregar participante',
    }
  }
}

/**
 * Eliminar participante de un sobre
 */
export async function eliminarParticipante(
  sobreId: string,
  userId: string,
  participanteId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    // Verificar que el usuario es OWNER o ADMIN
    const participantes = await findParticipantesBySobre(sobreId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    if (!participante || (participante.rol !== 'OWNER' && participante.rol !== 'ADMIN')) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar participantes',
      }
    }

    // No permitir eliminar al OWNER
    const aEliminar = participantes.find((p: any) => p.usuario_id === participanteId)
    if (aEliminar?.rol === 'OWNER') {
      return {
        success: false,
        error: 'No se puede eliminar al propietario del sobre',
      }
    }

    await removeParticipanteFromSobre(sobreId, participanteId)

    return {
      success: true,
      data: { message: 'Participante eliminado correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar participante:', error)
    return {
      success: false,
      error: 'Error al eliminar participante',
    }
  }
}

/**
 * Vincular categorías a un sobre
 */
export async function vincularCategorias(
  sobreId: string,
  userId: string,
  categoriaIds: string[]
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    // Verificar que el usuario es OWNER o ADMIN
    const participantes = await findParticipantesBySobre(sobreId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    if (!participante || (participante.rol !== 'OWNER' && participante.rol !== 'ADMIN')) {
      return {
        success: false,
        error: 'No tienes permiso para vincular categorías',
      }
    }

    await linkCategoriasToSobre(sobreId, categoriaIds)

    return {
      success: true,
      data: { message: 'Categorías vinculadas correctamente' },
    }
  } catch (error) {
    console.error('Error al vincular categorías:', error)
    return {
      success: false,
      error: 'Error al vincular categorías',
    }
  }
}

/**
 * Obtener participantes de un sobre
 */
export async function obtenerParticipantes(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    const participantes = await findParticipantesBySobre(sobreId)

    return {
      success: true,
      data: participantes,
    }
  } catch (error) {
    console.error('Error al obtener participantes:', error)
    return {
      success: false,
      error: 'Error al obtener participantes',
    }
  }
}

/**
 * Obtener categorías vinculadas a un sobre
 */
export async function obtenerCategoriasSobre(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    const categorias = await findCategoriasBySobre(sobreId)

    return {
      success: true,
      data: categorias,
    }
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return {
      success: false,
      error: 'Error al obtener categorías',
    }
  }
}

/**
 * ============================================================================
 * OPERACIONES DE PRESUPUESTO (Budget operations)
 * ============================================================================
 */

/**
 * Obtener asignaciones de presupuesto de un sobre
 * Retorna billeteras asignadas con sus montos
 */
export async function obtenerAsignacionesSobre(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    const { findAsignacionesBySobre, getResumenAsignacionesBySobre } =
      await import('@/infrastructure/database/queries/sobres.queries')

    const asignaciones = await findAsignacionesBySobre(sobreId)
    const resumen = await getResumenAsignacionesBySobre(sobreId)

    return {
      success: true,
      data: {
        asignaciones,
        resumen,
      },
    }
  } catch (error) {
    console.error('Error al obtener asignaciones:', error)
    return {
      success: false,
      error: 'Error al obtener asignaciones',
    }
  }
}

/**
 * Obtener asignaciones de un usuario específico en un sobre
 */
export async function obtenerAsignacionesUsuarioInSobre(
  sobreId: string,
  userId: string
): Promise<SobreResult> {
  try {
    // Verificar que el sobre existe y el usuario tiene acceso
    const sobreResult = await obtenerSobre(sobreId, userId)
    if (!sobreResult.success) {
      return sobreResult
    }

    const { findAsignacionesByUsuarioInSobre } =
      await import('@/infrastructure/database/queries/sobres.queries')

    const asignaciones = await findAsignacionesByUsuarioInSobre(sobreId, userId)

    return {
      success: true,
      data: asignaciones,
    }
  } catch (error) {
    console.error('Error al obtener asignaciones del usuario:', error)
    return {
      success: false,
      error: 'Error al obtener asignaciones',
    }
  }
}

