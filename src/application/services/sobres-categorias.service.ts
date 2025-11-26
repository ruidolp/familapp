/**
 * Servicio de Categorías en Sobres
 *
 * Gestión de relaciones entre sobres y categorías
 * - Agregar categoría a un sobre
 * - Eliminar categoría de un sobre
 * - Obtener categorías con cálculo de gastos
 */

import {
  addCategoriasToSobre,
  removeCategoriasFromSobre,
  findCategoriasWithGastosBySobre,
  findSobreById,
  findParticipanteInSobre,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  obtenerCategoria,
} from './categorias.service'

export interface SobresCategoriaResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Agregar una categoría a un sobre
 */
export async function agregarCategoriaToSobre(
  sobreId: string,
  categoriaId: string,
  userId: string
): Promise<SobresCategoriaResult> {
  try {
    // Validar que el sobre existe
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return {
        success: false,
        error: 'Sobre no encontrado',
      }
    }

    // Validar que el usuario puede modificar el sobre
    // (propietario, ADMIN o participante CONTRIBUTOR en sobre compartido)
    const isOwner = sobre.usuario_id === userId
    const participante = sobre.is_compartido
      ? await findParticipanteInSobre(sobreId, userId)
      : null
    const canModify = isOwner || (participante && (participante.rol === 'CONTRIBUTOR' || participante.rol === 'ADMIN'))

    if (!canModify) {
      return {
        success: false,
        error: 'No tienes permiso para agregar categorías a este sobre',
      }
    }

    // Validar que la categoría existe
    const { findCategoriaById } = await import('@/infrastructure/database/queries/categorias.queries')
    const categoria = await findCategoriaById(categoriaId)

    if (!categoria) {
      console.error(`[agregarCategoriaToSobre] Categoría ${categoriaId} no existe en la base de datos`)
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // NUEVA LÓGICA: Permitir agregar si:
    // 1. La categoría pertenece al usuario Y el usuario puede modificar el sobre, O
    // 2. El usuario es colaborador de otro sobre que ya tiene esta categoría
    const categoriaDelUsuario = categoria.usuario_id === userId

    if (!categoriaDelUsuario) {
      // Si la categoría NO pertenece al usuario, validar que sea colaborador de un sobre que la tenga
      console.log(`[agregarCategoriaToSobre] Categoría ${categoriaId} no pertenece al usuario ${userId}. Verificando colaboración...`)

      const { db } = await import('@/infrastructure/database/kysely')
      const colaborador = await db
        .selectFrom('sobres_categorias as sc')
        .innerJoin('sobres as s', 'sc.sobre_id', 's.id')
        .innerJoin('sobres_usuarios as su', 's.id', 'su.sobre_id')
        .select('su.rol')
        .where('sc.categoria_id', '=', categoriaId)
        .where('su.usuario_id', '=', userId)
        .where('s.deleted_at', 'is', null)
        .where((eb) => eb.or([
          eb('su.rol', '=', 'CONTRIBUTOR'),
          eb('su.rol', '=', 'ADMIN'),
          eb('su.rol', '=', 'OWNER')
        ]))
        .executeTakeFirst()

      if (!colaborador) {
        console.error(`[agregarCategoriaToSobre] Usuario ${userId} no puede agregar categoría ${categoriaId} (no es dueño ni colaborador)`)
        return {
          success: false,
          error: 'No tienes permiso para agregar esta categoría. Esta categoría pertenece a otro usuario y no eres colaborador de ningún sobre que la use.',
        }
      }

      console.log(`[agregarCategoriaToSobre] Usuario ${userId} es ${colaborador.rol} de un sobre con categoría ${categoriaId} - Permitido`)
    } else {
      console.log(`[agregarCategoriaToSobre] Categoría ${categoriaId} pertenece al usuario ${userId} - Permitido`)
    }

    // Agregar categoría al sobre
    const resultado = await addCategoriasToSobre(sobreId, categoriaId)

    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    console.error('Error al agregar categoría al sobre:', error)
    return {
      success: false,
      error: 'Error al agregar la categoría',
    }
  }
}

/**
 * Obtener categorías de un sobre CON cálculo de gastos
 */
export async function obtenerCategoriasBySobre(
  sobreId: string,
  userId: string
): Promise<SobresCategoriaResult> {
  try {
    // Validar que el sobre existe
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return {
        success: false,
        error: 'Sobre no encontrado',
      }
    }

    // Validar que el usuario puede acceder al sobre
    // (propietario o participante en sobre compartido)
    const isOwner = sobre.usuario_id === userId
    const isParticipant = sobre.is_compartido
      ? await findParticipanteInSobre(sobreId, userId)
      : null

    if (!isOwner && !isParticipant) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a este sobre',
      }
    }

    // Obtener categorías con gastos
    const categorias = await findCategoriasWithGastosBySobre(sobreId)

    return {
      success: true,
      data: categorias,
    }
  } catch (error) {
    console.error('Error al obtener categorías del sobre:', error)
    return {
      success: false,
      error: 'Error al obtener las categorías',
    }
  }
}

/**
 * Eliminar una categoría de un sobre
 */
export async function eliminarCategoriaFromSobre(
  sobreId: string,
  categoriaId: string,
  userId: string
): Promise<SobresCategoriaResult> {
  try {
    // Validar que el sobre existe
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return {
        success: false,
        error: 'Sobre no encontrado',
      }
    }

    // Validar que el usuario puede modificar el sobre
    // (propietario, ADMIN o participante CONTRIBUTOR en sobre compartido)
    const isOwner = sobre.usuario_id === userId
    const participante = sobre.is_compartido
      ? await findParticipanteInSobre(sobreId, userId)
      : null
    const canModify = isOwner || (participante && (participante.rol === 'CONTRIBUTOR' || participante.rol === 'ADMIN'))

    if (!canModify) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar categorías de este sobre',
      }
    }

    // Validar que la categoría existe y pertenece al usuario
    const categoriaResult = await obtenerCategoria(categoriaId, userId)
    if (!categoriaResult.success) {
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // Eliminar categoría del sobre
    await removeCategoriasFromSobre(sobreId, categoriaId)

    return {
      success: true,
      data: { message: 'Categoría eliminada del sobre correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar categoría del sobre:', error)
    return {
      success: false,
      error: 'Error al eliminar la categoría',
    }
  }
}
