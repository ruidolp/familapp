/**
 * Servicio de Categorías
 *
 * Contiene la lógica de negocio para gestión de categorías y subcategorías:
 * - Crear, actualizar, eliminar categorías
 * - Crear, actualizar, eliminar subcategorías (marcas/empresas)
 * - Consultar gastos por categoría
 * - Validación de reglas de negocio
 */

import {
  createCategoria,
  findCategoriaById,
  findCategoriasByUser,
  findCategoriaByNombre,
  updateCategoria,
  softDeleteCategoria,
} from '@/infrastructure/database/queries/categorias.queries'
import {
  createSubcategoria,
  findSubcategoriaById,
  findSubcategoriasByCategoria,
  findSubcategoriaByNombre,
  updateSubcategoria,
  softDeleteSubcategoria,
} from '@/infrastructure/database/queries/subcategorias.queries'
import {
  findTransaccionesByCategoria,
} from '@/infrastructure/database/queries/transacciones.queries'

/**
 * Datos para crear una categoría
 */
export interface CreateCategoriaInput {
  nombre: string
  color?: string
  emoji?: string
  userId: string
}

/**
 * Datos para actualizar una categoría
 */
export interface UpdateCategoriaInput {
  nombre?: string
  color?: string
  emoji?: string
}

/**
 * Datos para crear una subcategoría
 */
export interface CreateSubcategoriaInput {
  nombre: string
  categoriaId: string
  color?: string
  emoji?: string
  userId: string
}

/**
 * Datos para actualizar una subcategoría
 */
export interface UpdateSubcategoriaInput {
  nombre?: string
  color?: string
  emoji?: string
}

/**
 * Resultado de operación
 */
export interface CategoriaResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Crear una nueva categoría
 */
export async function crearCategoria(
  input: CreateCategoriaInput
): Promise<CategoriaResult> {
  try {
    // Validar nombre (no vacío)
    if (!input.nombre || input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre de la categoría es requerido',
      }
    }

    // Verificar que no exista otra categoría con el mismo nombre
    const existente = await findCategoriaByNombre(input.userId, input.nombre.trim())
    if (existente) {
      return {
        success: false,
        error: 'Ya existe una categoría con ese nombre',
      }
    }

    // Crear categoría
    const categoria = await createCategoria({
      nombre: input.nombre.trim(),
      color: input.color,
      emoji: input.emoji,
      usuario_id: input.userId,
    })

    return {
      success: true,
      data: categoria,
    }
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return {
      success: false,
      error: 'Error al crear la categoría',
    }
  }
}

/**
 * Obtener todas las categorías del usuario
 */
export async function obtenerCategoriasUsuario(
  userId: string
): Promise<CategoriaResult> {
  try {
    const categorias = await findCategoriasByUser(userId)
    return {
      success: true,
      data: categorias,
    }
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return {
      success: false,
      error: 'Error al obtener las categorías',
    }
  }
}

/**
 * Obtener una categoría por ID
 */
export async function obtenerCategoria(
  categoriaId: string,
  userId: string
): Promise<CategoriaResult> {
  try {
    const categoria = await findCategoriaById(categoriaId)

    if (!categoria) {
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // Verificar que la categoría pertenece al usuario
    if (categoria.usuario_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a esta categoría',
      }
    }

    return {
      success: true,
      data: categoria,
    }
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    return {
      success: false,
      error: 'Error al obtener la categoría',
    }
  }
}

/**
 * Actualizar una categoría
 */
export async function actualizarCategoria(
  categoriaId: string,
  userId: string,
  input: UpdateCategoriaInput
): Promise<CategoriaResult> {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const categoriaResult = await obtenerCategoria(categoriaId, userId)
    if (!categoriaResult.success) {
      return categoriaResult
    }

    // Validar nombre si se proporciona
    if (input.nombre !== undefined && input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre no puede estar vacío',
      }
    }

    // Verificar que no exista otra categoría con el mismo nombre
    if (input.nombre) {
      const existente = await findCategoriaByNombre(userId, input.nombre.trim())
      if (existente && existente.id !== categoriaId) {
        return {
          success: false,
          error: 'Ya existe una categoría con ese nombre',
        }
      }
    }

    const updateData: any = {}
    if (input.nombre) updateData.nombre = input.nombre.trim()
    if (input.color !== undefined) updateData.color = input.color
    if (input.emoji !== undefined) updateData.emoji = input.emoji

    const categoria = await updateCategoria(categoriaId, updateData)

    return {
      success: true,
      data: categoria,
    }
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return {
      success: false,
      error: 'Error al actualizar la categoría',
    }
  }
}

/**
 * Eliminar una categoría (soft delete)
 *
 * VALIDACIÓN: Si la categoría tiene transacciones, retorna error pidiendo
 * que se eliminen primero las transacciones
 */
export async function eliminarCategoria(
  categoriaId: string,
  userId: string
): Promise<CategoriaResult> {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const categoriaResult = await obtenerCategoria(categoriaId, userId)
    if (!categoriaResult.success) {
      return categoriaResult
    }

    // VALIDACIÓN: Contar transacciones asociadas a esta categoría
    const transacciones = await findTransaccionesByCategoria(categoriaId)

    if (transacciones && transacciones.length > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría. Tiene ${transacciones.length} transacciones registradas. Debe eliminarlas primero.`,
      }
    }

    await softDeleteCategoria(categoriaId)

    return {
      success: true,
      data: { message: 'Categoría eliminada correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return {
      success: false,
      error: 'Error al eliminar la categoría',
    }
  }
}

/**
 * Crear una nueva subcategoría (marca/empresa)
 */
export async function crearSubcategoria(
  input: CreateSubcategoriaInput
): Promise<CategoriaResult> {
  try {
    // Validar nombre (no vacío)
    if (!input.nombre || input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre de la subcategoría es requerido',
      }
    }

    // Verificar que la categoría existe y pertenece al usuario
    const categoriaResult = await obtenerCategoria(input.categoriaId, input.userId)
    if (!categoriaResult.success) {
      return {
        success: false,
        error: 'Categoría no válida',
      }
    }

    // Verificar que no exista otra subcategoría con el mismo nombre en esta categoría
    const existente = await findSubcategoriaByNombre(
      input.userId,
      input.categoriaId,
      input.nombre.trim()
    )
    if (existente) {
      return {
        success: false,
        error: 'Ya existe una subcategoría con ese nombre en esta categoría',
      }
    }

    // Crear subcategoría
    const subcategoria = await createSubcategoria({
      nombre: input.nombre.trim(),
      categoria_id: input.categoriaId,
      color: input.color,
      emoji: input.emoji,
      usuario_id: input.userId,
    })

    return {
      success: true,
      data: subcategoria,
    }
  } catch (error) {
    console.error('Error al crear subcategoría:', error)
    return {
      success: false,
      error: 'Error al crear la subcategoría',
    }
  }
}

/**
 * Obtener subcategorías de una categoría
 */
export async function obtenerSubcategorias(
  categoriaId: string,
  userId: string
): Promise<CategoriaResult> {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const categoriaResult = await obtenerCategoria(categoriaId, userId)
    if (!categoriaResult.success) {
      return categoriaResult
    }

    const subcategorias = await findSubcategoriasByCategoria(categoriaId)

    return {
      success: true,
      data: subcategorias,
    }
  } catch (error) {
    console.error('Error al obtener subcategorías:', error)
    return {
      success: false,
      error: 'Error al obtener las subcategorías',
    }
  }
}

/**
 * Obtener una subcategoría por ID
 */
export async function obtenerSubcategoria(
  subcategoriaId: string,
  userId: string
): Promise<CategoriaResult> {
  try {
    const subcategoria = await findSubcategoriaById(subcategoriaId)

    if (!subcategoria) {
      return {
        success: false,
        error: 'Subcategoría no encontrada',
      }
    }

    // Verificar que la subcategoría pertenece al usuario
    if (subcategoria.usuario_id !== userId) {
      return {
        success: false,
        error: 'No tienes permiso para acceder a esta subcategoría',
      }
    }

    return {
      success: true,
      data: subcategoria,
    }
  } catch (error) {
    console.error('Error al obtener subcategoría:', error)
    return {
      success: false,
      error: 'Error al obtener la subcategoría',
    }
  }
}

/**
 * Actualizar una subcategoría
 */
export async function actualizarSubcategoria(
  subcategoriaId: string,
  userId: string,
  input: UpdateSubcategoriaInput
): Promise<CategoriaResult> {
  try {
    // Verificar que la subcategoría existe y pertenece al usuario
    const subcategoriaResult = await obtenerSubcategoria(subcategoriaId, userId)
    if (!subcategoriaResult.success) {
      return subcategoriaResult
    }

    const subcategoria = subcategoriaResult.data

    // Validar nombre si se proporciona
    if (input.nombre !== undefined && input.nombre.trim().length === 0) {
      return {
        success: false,
        error: 'El nombre no puede estar vacío',
      }
    }

    // Verificar que no exista otra subcategoría con el mismo nombre en esta categoría
    if (input.nombre) {
      const existente = await findSubcategoriaByNombre(
        userId,
        subcategoria.categoria_id,
        input.nombre.trim()
      )
      if (existente && existente.id !== subcategoriaId) {
        return {
          success: false,
          error: 'Ya existe una subcategoría con ese nombre en esta categoría',
        }
      }
    }

    const updateData: any = {}
    if (input.nombre) updateData.nombre = input.nombre.trim()
    if (input.color !== undefined) updateData.color = input.color
    if (input.emoji !== undefined) updateData.emoji = input.emoji

    const updatedSubcategoria = await updateSubcategoria(subcategoriaId, updateData)

    return {
      success: true,
      data: updatedSubcategoria,
    }
  } catch (error) {
    console.error('Error al actualizar subcategoría:', error)
    return {
      success: false,
      error: 'Error al actualizar la subcategoría',
    }
  }
}

/**
 * Eliminar una subcategoría (soft delete)
 */
export async function eliminarSubcategoria(
  subcategoriaId: string,
  userId: string
): Promise<CategoriaResult> {
  try {
    // Verificar que la subcategoría existe y pertenece al usuario
    const subcategoriaResult = await obtenerSubcategoria(subcategoriaId, userId)
    if (!subcategoriaResult.success) {
      return subcategoriaResult
    }

    await softDeleteSubcategoria(subcategoriaId)

    return {
      success: true,
      data: { message: 'Subcategoría eliminada correctamente' },
    }
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error)
    return {
      success: false,
      error: 'Error al eliminar la subcategoría',
    }
  }
}
