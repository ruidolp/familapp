/**
 * Subcategorías Queries
 *
 * Queries para gestión de subcategorías (marcas/empresas)
 */

import { db } from '../kysely'

import type { SubcategoriasTable } from '../types'

/**
 * Tipo para creación de subcategoría
 */
export type CreateSubcategoriaData = {
  nombre: string
  categoria_id: string
  usuario_id: string
  color?: string
  emoji?: string
  imagen_url?: string
}

/**
 * Tipo para actualización de subcategoría
 */
export type UpdateSubcategoriaData = {
  nombre?: string
  categoria_id?: string
  color?: string
  emoji?: string
  imagen_url?: string
}

/**
 * Buscar subcategoría por ID (sin soft-deleted)
 */
export async function findSubcategoriaById(subcategoriaId: string) {
  return await db
    .selectFrom('subcategorias')
    .selectAll()
    .where('id', '=', subcategoriaId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar subcategorías por usuario
 */
export async function findSubcategoriasByUser(userId: string) {
  return await db
    .selectFrom('subcategorias')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

/**
 * Buscar subcategorías por categoría
 */
export async function findSubcategoriasByCategoria(categoriaId: string) {
  return await db
    .selectFrom('subcategorias')
    .selectAll()
    .where('categoria_id', '=', categoriaId)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

/**
 * Buscar subcategoría por nombre en categoría (case-insensitive)
 */
export async function findSubcategoriaByNombre(
  userId: string,
  categoriaId: string,
  nombre: string
) {
  return await db
    .selectFrom('subcategorias')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('categoria_id', '=', categoriaId)
    .where((eb: any) => eb(eb.fn('LOWER', ['nombre']), '=', nombre.toLowerCase()))
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Crear nueva subcategoría
 */
export async function createSubcategoria(subcategoriaData: CreateSubcategoriaData) {
  return await db
    .insertInto('subcategorias')
    .values({
      ...subcategoriaData,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar subcategoría
 */
export async function updateSubcategoria(
  subcategoriaId: string,
  subcategoriaData: UpdateSubcategoriaData
) {
  return await db
    .updateTable('subcategorias')
    .set({
      ...subcategoriaData,
      updated_at: new Date(),
    })
    .where('id', '=', subcategoriaId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de subcategoría
 */
export async function softDeleteSubcategoria(subcategoriaId: string) {
  return await db
    .updateTable('subcategorias')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', subcategoriaId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar subcategorías con información de categoría
 */
export async function findSubcategoriasWithCategoria(userId: string) {
  return await db
    .selectFrom('subcategorias')
    .innerJoin('categorias', 'subcategorias.categoria_id', 'categorias.id')
    .select([
      'subcategorias.id',
      'subcategorias.nombre',
      'subcategorias.categoria_id',
      'subcategorias.color',
      'subcategorias.emoji',
      'subcategorias.imagen_url',
      'categorias.nombre as categoria_nombre',
    ])
    .where('subcategorias.usuario_id', '=', userId)
    .where('subcategorias.deleted_at', 'is', null)
    .where('categorias.deleted_at', 'is', null)
    .orderBy('categorias.nombre', 'asc')
    .orderBy('subcategorias.nombre', 'asc')
    .execute()
}
