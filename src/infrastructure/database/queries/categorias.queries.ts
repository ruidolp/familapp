/**
 * Categorías Queries
 *
 * Queries para gestión de categorías (conceptos de gasto)
 */

import { db } from '../kysely'

import type { CategoriasTable } from '../types'

/**
 * Tipo para creación de categoría
 */
export type CreateCategoriaData = {
  nombre: string
  usuario_id: string
  color?: string
  emoji?: string
}

/**
 * Tipo para actualización de categoría
 */
export type UpdateCategoriaData = {
  nombre?: string
  color?: string
  emoji?: string
}

/**
 * Buscar categoría por ID (sin soft-deleted)
 */
export async function findCategoriaById(categoriaId: string) {
  return await db
    .selectFrom('categorias')
    .selectAll()
    .where('id', '=', categoriaId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar categorías por usuario
 */
export async function findCategoriasByUser(userId: string) {
  return await db
    .selectFrom('categorias')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

/**
 * Buscar categoría por nombre (case-insensitive)
 */
export async function findCategoriaByNombre(userId: string, nombre: string) {
  return await db
    .selectFrom('categorias')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where((eb: any) => eb(eb.fn('LOWER', ['nombre']), '=', nombre.toLowerCase()))
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Crear nueva categoría
 */
export async function createCategoria(categoriaData: CreateCategoriaData) {
  return await db
    .insertInto('categorias')
    .values({
      ...categoriaData,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar categoría
 */
export async function updateCategoria(categoriaId: string, categoriaData: UpdateCategoriaData) {
  return await db
    .updateTable('categorias')
    .set({
      ...categoriaData,
      updated_at: new Date(),
    })
    .where('id', '=', categoriaId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de categoría
 */
export async function softDeleteCategoria(categoriaId: string) {
  return await db
    .updateTable('categorias')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', categoriaId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * SOBRES_CATEGORIAS (relación N:N)
 */

/**
 * Vincular categoría a sobre
 */
export async function linkCategoriaToSobre(sobreId: string, categoriaId: string) {
  return await db
    .insertInto('sobres_categorias')
    .values({
      sobre_id: sobreId,
      categoria_id: categoriaId,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Desvincular categoría de sobre
 */
export async function unlinkCategoriaFromSobre(sobreId: string, categoriaId: string) {
  return await db
    .deleteFrom('sobres_categorias')
    .where('sobre_id', '=', sobreId)
    .where('categoria_id', '=', categoriaId)
    .executeTakeFirst()
}

/**
 * Obtener categorías de un sobre
 */
export async function findCategoriasBySobre(sobreId: string) {
  return await db
    .selectFrom('categorias')
    .innerJoin('sobres_categorias', 'categorias.id', 'sobres_categorias.categoria_id')
    .selectAll('categorias')
    .where('sobres_categorias.sobre_id', '=', sobreId)
    .where('categorias.deleted_at', 'is', null)
    .orderBy('categorias.nombre', 'asc')
    .execute()
}

/**
 * Obtener sobres que usan una categoría
 */
export async function findSobresByCategoria(categoriaId: string) {
  return await db
    .selectFrom('sobres')
    .innerJoin('sobres_categorias', 'sobres.id', 'sobres_categorias.sobre_id')
    .selectAll('sobres')
    .where('sobres_categorias.categoria_id', '=', categoriaId)
    .where('sobres.deleted_at', 'is', null)
    .execute()
}

/**
 * Verificar si una categoría está vinculada a un sobre
 */
export async function isCategoriaLinkedToSobre(sobreId: string, categoriaId: string): Promise<boolean> {
  const result = await db
    .selectFrom('sobres_categorias')
    .select('categoria_id')
    .where('sobre_id', '=', sobreId)
    .where('categoria_id', '=', categoriaId)
    .executeTakeFirst()

  return !!result
}

/**
 * Vincular múltiples categorías a un sobre
 */
export async function linkCategoriasToSobre(sobreId: string, categoriaIds: string[]) {
  const values = categoriaIds.map((categoriaId) => ({
    sobre_id: sobreId,
    categoria_id: categoriaId,
    created_at: new Date(),
  }))

  return await db
    .insertInto('sobres_categorias')
    .values(values)
    .execute()
}
