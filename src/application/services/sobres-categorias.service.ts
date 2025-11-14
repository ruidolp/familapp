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

    // Validar que el usuario es propietario del sobre
    if (sobre.usuario_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para agregar categorías a este sobre',
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
    if (sobre.usuario_id !== userId) {
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

    // Validar que el usuario es propietario del sobre
    if (sobre.usuario_id !== userId) {
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
