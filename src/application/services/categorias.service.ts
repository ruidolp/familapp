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
  linkCategoriaToSobre,
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
  sobreId?: string
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
  // ============ DEBUG MODE ============
  console.log('🔍 [SERVICE DEBUG] crearCategoria iniciado')
  console.log('🔍 [SERVICE DEBUG] Input:', JSON.stringify(input, null, 2))

  try {
    // Validar nombre (no vacío)
    console.log('🔍 [SERVICE DEBUG] Validando nombre...')
    if (!input.nombre || input.nombre.trim().length === 0) {
      console.error('❌ [SERVICE DEBUG] Nombre vacío o inválido')
      return {
        success: false,
        error: 'El nombre de la categoría es requerido',
      }
    }
    console.log('✅ [SERVICE DEBUG] Nombre válido:', input.nombre.trim())

    // Verificar que no exista otra categoría con el mismo nombre
    console.log('🔍 [SERVICE DEBUG] Verificando nombre duplicado...')
    const existente = await findCategoriaByNombre(input.userId, input.nombre.trim())
    console.log('🔍 [SERVICE DEBUG] Categoría existente:', existente ? `Sí (id: ${existente.id})` : 'No')

    if (existente) {
      console.error('❌ [SERVICE DEBUG] Ya existe categoría con nombre:', input.nombre.trim())
      return {
        success: false,
        error: 'Ya existe una categoría con ese nombre',
      }
    }

    // Crear categoría
    console.log('🔍 [SERVICE DEBUG] Creando categoría en BD...')
    const categoriaData = {
      nombre: input.nombre.trim(),
      color: input.color,
      emoji: input.emoji,
      usuario_id: input.userId,
    }
    console.log('🔍 [SERVICE DEBUG] Datos para crear:', JSON.stringify(categoriaData, null, 2))

    const categoria = await createCategoria(categoriaData)
    console.log('✅ [SERVICE DEBUG] Categoría creada:', JSON.stringify({
      id: categoria.id,
      nombre: categoria.nombre,
      emoji: categoria.emoji,
      usuario_id: categoria.usuario_id
    }, null, 2))

    // Si se proporciona un sobreId, vincular la categoría al sobre
    if (input.sobreId) {
      console.log('🔍 [SERVICE DEBUG] Vinculando categoría al sobre:', input.sobreId)
      try {
        await linkCategoriaToSobre(input.sobreId, categoria.id)
        console.log('✅ [SERVICE DEBUG] Categoría vinculada al sobre exitosamente')
      } catch (linkError: any) {
        console.error('❌ [SERVICE DEBUG] Error al vincular al sobre:', linkError)
        console.error('❌ [SERVICE DEBUG] Link error stack:', linkError.stack)
        // No fallar todo el proceso si falla el linkeo
        console.warn('⚠️ [SERVICE DEBUG] Categoría creada pero NO vinculada al sobre')
      }
    } else {
      console.log('ℹ️ [SERVICE DEBUG] No hay sobreId, categoría no vinculada')
    }

    console.log('✅ [SERVICE DEBUG] crearCategoria exitoso')
    return {
      success: true,
      data: categoria,
    }
  } catch (error: any) {
    console.error('❌ [SERVICE DEBUG] Exception en crearCategoria:', error)
    console.error('❌ [SERVICE DEBUG] Error stack:', error.stack)
    console.error('❌ [SERVICE DEBUG] Error message:', error.message)

    return {
      success: false,
      error: `Error al crear la categoría: ${error.message}`,
    }
  } finally {
    console.log('🏁 [SERVICE DEBUG] crearCategoria finalizado')
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
      console.error(`[obtenerCategoria] Categoría ${categoriaId} no existe en la base de datos`)
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // Verificar que la categoría pertenece al usuario
    // O que el usuario es colaborador (CONTRIBUTOR/ADMIN) de un sobre que tiene esta categoría
    const isOwner = categoria.usuario_id === userId

    if (!isOwner) {
      console.log(`[obtenerCategoria] Categoría ${categoriaId} no pertenece al usuario ${userId} (owner: ${categoria.usuario_id}). Verificando si es colaborador...`)

      // Verificar si el usuario es colaborador de un sobre con esta categoría
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
          eb('su.rol', '=', 'ADMIN')
        ]))
        .executeTakeFirst()

      if (!colaborador) {
        console.error(`[obtenerCategoria] Usuario ${userId} no es colaborador de ningún sobre que tenga la categoría ${categoriaId}`)
        return {
          success: false,
          error: 'No tienes permiso para acceder a esta categoría. Esta categoría pertenece a otro usuario y no eres colaborador de ningún sobre que la use.',
        }
      }

      console.log(`[obtenerCategoria] Usuario ${userId} es ${colaborador.rol} de un sobre con categoría ${categoriaId}`)
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
    // O que el usuario es colaborador (CONTRIBUTOR/ADMIN) de un sobre que tiene esta categoría
    const isOwner = subcategoria.usuario_id === userId

    if (!isOwner) {
      // Verificar si el usuario es colaborador de un sobre con esta categoría
      const { db } = await import('@/infrastructure/database/kysely')
      const colaborador = await db
        .selectFrom('sobres_categorias as sc')
        .innerJoin('sobres as s', 'sc.sobre_id', 's.id')
        .innerJoin('sobres_usuarios as su', 's.id', 'su.sobre_id')
        .select('su.rol')
        .where('sc.categoria_id', '=', subcategoria.categoria_id)
        .where('su.usuario_id', '=', userId)
        .where('s.deleted_at', 'is', null)
        .where((eb) => eb.or([
          eb('su.rol', '=', 'CONTRIBUTOR'),
          eb('su.rol', '=', 'ADMIN')
        ]))
        .executeTakeFirst()

      if (!colaborador) {
        return {
          success: false,
          error: 'No tienes permiso para acceder a esta subcategoría',
        }
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
