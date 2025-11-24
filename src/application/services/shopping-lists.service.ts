/**
 * Servicio de Listas de Compras
 *
 * Contiene la lógica de negocio para gestión de listas compartidas:
 * - Gestión de participantes (listas compartidas)
 * - Validación de permisos por rol
 * - Validación de reglas de negocio
 */

import {
  getShoppingListById,
  updateShoppingList,
  softDeleteShoppingList,
  addCollaborator,
  removeCollaborator,
  findParticipantesByLista,
  updateParticipanteListaRole,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import type { RolListaUsuario } from '@/infrastructure/database/custom-enums'

/**
 * Datos para actualizar una lista
 */
export interface UpdateListaInput {
  nombre?: string
  descripcion?: string
}

/**
 * Datos para agregar participante
 */
export interface AddParticipanteListaInput {
  listaId: string
  userId: string
  participanteId: string
  rol: RolListaUsuario
}

/**
 * Resultado de operación
 */
export interface ListaResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Verificar si el usuario tiene acceso a una lista
 * Retorna true si es owner o colaborador
 */
export async function canUserAccessList(
  listaId: string,
  userId: string
): Promise<boolean> {
  try {
    const lista = await getShoppingListById(listaId)
    if (!lista) return false

    // Check if user is owner
    if (lista.user_id === userId) return true

    // Check if user is collaborator
    const participantes = await findParticipantesByLista(listaId)
    return participantes.some((p: any) => p.usuario_id === userId)
  } catch (error) {
    console.error('Error checking user access to list:', error)
    return false
  }
}

/**
 * Obtener el permiso/rol del usuario en una lista
 * Retorna 'OWNER', 'EDITOR', 'EXECUTION_ONLY' o null si no tiene acceso
 */
export async function getUserPermissionForList(
  listaId: string,
  userId: string
): Promise<RolListaUsuario | null> {
  try {
    const lista = await getShoppingListById(listaId)
    if (!lista) return null

    // Check if user is owner
    if (lista.user_id === userId) return 'OWNER'

    // Check if user is collaborator and get their role
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    return participante ? (participante.rol as RolListaUsuario) : null
  } catch (error) {
    console.error('Error getting user permission for list:', error)
    return null
  }
}

/**
 * Obtener una lista por ID con validación de permisos
 */
export async function obtenerLista(
  listaId: string,
  userId: string
): Promise<ListaResult> {
  try {
    const lista = await getShoppingListById(listaId)

    if (!lista) {
      return {
        success: false,
        error: 'Lista no encontrada',
      }
    }

    // Verificar que el usuario tiene acceso (es owner o colaborador)
    const tieneAcceso = await canUserAccessList(listaId, userId)

    if (!tieneAcceso) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a esta lista',
      }
    }

    return {
      success: true,
      data: lista,
    }
  } catch (error) {
    console.error('Error al obtener lista:', error)
    return {
      success: false,
      error: 'Error al obtener la lista',
    }
  }
}

/**
 * Actualizar una lista (solo OWNER puede cambiar nombre/descripción)
 */
export async function actualizarLista(
  listaId: string,
  userId: string,
  input: UpdateListaInput
): Promise<ListaResult> {
  try {
    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const lista = listaResult.data

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    const isOwner =
      lista.user_id === userId || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede editar nombre y descripción de la lista',
      }
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
    if (input.descripcion !== undefined) updateData.descripcion = input.descripcion

    const listaActualizada = await updateShoppingList(listaId, updateData)

    return {
      success: true,
      data: listaActualizada,
    }
  } catch (error) {
    console.error('Error al actualizar lista:', error)
    return {
      success: false,
      error: 'Error al actualizar la lista',
    }
  }
}

/**
 * Eliminar una lista (soft delete, solo OWNER)
 */
export async function eliminarLista(
  listaId: string,
  userId: string
): Promise<ListaResult> {
  try {
    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const lista = listaResult.data

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    const isOwner =
      lista.user_id === userId || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede eliminar la lista',
      }
    }

    await softDeleteShoppingList(listaId)

    return {
      success: true,
      data: { message: 'Lista eliminada correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar lista:', error)
    return {
      success: false,
      error: 'Error al eliminar la lista',
    }
  }
}

/**
 * Agregar participante a una lista
 */
export async function agregarParticipante(
  input: AddParticipanteListaInput
): Promise<ListaResult> {
  try {
    const { listaId, userId, participanteId, rol } = input

    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const lista = listaResult.data

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    const isOwner =
      lista.user_id === userId || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede agregar participantes',
      }
    }

    // Verificar que el participante no existe ya
    const yaExiste = participantes.some((p: any) => p.usuario_id === participanteId)
    if (yaExiste) {
      return {
        success: false,
        error: 'El usuario ya es participante de esta lista',
      }
    }

    // Validar rol
    const rolesValidos: RolListaUsuario[] = ['OWNER', 'EDITOR', 'EXECUTION_ONLY']
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
        error: 'Solo puede haber un propietario por lista',
      }
    }

    await addCollaborator(listaId, participanteId, rol as any, userId)

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
 * Eliminar participante de una lista
 */
export async function eliminarParticipante(
  listaId: string,
  userId: string,
  participanteId: string
): Promise<ListaResult> {
  try {
    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const lista = listaResult.data

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    const isOwner =
      lista.user_id === userId || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede eliminar participantes',
      }
    }

    // No permitir eliminar al OWNER
    const aEliminar = participantes.find((p: any) => p.usuario_id === participanteId)
    if (aEliminar?.rol === 'OWNER') {
      return {
        success: false,
        error: 'No se puede eliminar al propietario de la lista',
      }
    }

    await removeCollaborator(listaId, participanteId)

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
 * Obtener participantes de una lista
 */
export async function obtenerParticipantes(
  listaId: string,
  userId: string
): Promise<ListaResult> {
  try {
    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const participantes = await findParticipantesByLista(listaId)

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
 * Actualizar rol de participante
 */
export async function actualizarRolParticipante(
  listaId: string,
  userId: string,
  participanteId: string,
  nuevoRol: RolListaUsuario
): Promise<ListaResult> {
  try {
    // Verificar que la lista existe y el usuario tiene acceso
    const listaResult = await obtenerLista(listaId, userId)
    if (!listaResult.success) {
      return listaResult
    }

    const lista = listaResult.data

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === userId)

    const isOwner =
      lista.user_id === userId || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return {
        success: false,
        error: 'Solo el propietario puede modificar roles',
      }
    }

    // Validar rol
    const rolesValidos: RolListaUsuario[] = ['OWNER', 'EDITOR', 'EXECUTION_ONLY']
    if (!rolesValidos.includes(nuevoRol)) {
      return {
        success: false,
        error: 'Rol no válido',
      }
    }

    // No permitir cambiar a OWNER
    if (nuevoRol === 'OWNER') {
      return {
        success: false,
        error: 'No se puede asignar el rol OWNER',
      }
    }

    // No permitir cambiar rol del OWNER
    const aModificar = participantes.find((p: any) => p.usuario_id === participanteId)
    if (aModificar?.rol === 'OWNER') {
      return {
        success: false,
        error: 'No se puede modificar el rol del propietario',
      }
    }

    await updateParticipanteListaRole(listaId, participanteId, nuevoRol)

    return {
      success: true,
      data: { message: 'Rol actualizado correctamente' },
    }
  } catch (error) {
    console.error('Error al actualizar rol:', error)
    return {
      success: false,
      error: 'Error al actualizar rol',
    }
  }
}
