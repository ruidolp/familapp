import { db } from '../kysely'
import { sql } from 'kysely'
import type { RolListaUsuario } from '../custom-enums'

/**
 * SHOPPING LISTS - Queries
 */

// ============================================
// SHOPPING LISTS
// ============================================

export async function createShoppingList(
  userId: string,
  nombre: string,
  descripcion?: string | null
) {
  return db
    .insertInto('shopping_lists')
    .values({
      user_id: userId,
      nombre,
      descripcion,
      list_order: 0,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning([
      'id',
      'user_id',
      'nombre',
      'descripcion',
      'purchase_count',
      'created_at',
      'updated_at',
    ])
    .executeTakeFirstOrThrow()
}

export async function getShoppingListsByUser(userId: string) {
  return db
    .selectFrom('shopping_lists')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('updated_at', 'desc')
    .execute()
}

export async function getSharedShoppingLists(userId: string) {
  return db
    .selectFrom('shopping_lists as sl')
    .innerJoin('shopping_list_collaborators as slc', 'sl.id', 'slc.shopping_list_id')
    .innerJoin('users as owner', 'sl.user_id', 'owner.id')
    .leftJoin('users as shared_by', 'slc.added_by', 'shared_by.id')
    .selectAll('sl')
    .select([
      'slc.permission_level as user_role',
      'slc.added_by as shared_by_user_id',
      'owner.name as owner_name',
      'owner.email as owner_email',
      'shared_by.name as shared_by_name',
      'shared_by.email as shared_by_email',
    ])
    .where('slc.user_id', '=', userId)
    .where('sl.user_id', '!=', userId) // No incluir listas propias
    .where('sl.deleted_at', 'is', null)
    .where('slc.deleted_at', 'is', null)
    .orderBy('sl.updated_at', 'desc')
    .execute()
}

export async function getShoppingListById(id: string) {
  return db
    .selectFrom('shopping_lists')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function updateShoppingList(
  id: string,
  updates: {
    nombre?: string
    descripcion?: string
    list_order?: number
  }
) {
  return db
    .updateTable('shopping_lists')
    .set({
      ...updates,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returning(['id', 'nombre', 'descripcion', 'updated_at'])
    .executeTakeFirst()
}

export async function softDeleteShoppingList(id: string) {
  return db
    .updateTable('shopping_lists')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

export async function cloneShoppingList(
  originalListId: string,
  userId: string,
  newName: string
) {
  // Get original list
  const original = await getShoppingListById(originalListId)
  if (!original) throw new Error('Original list not found')

  // Create new list
  const newList = await createShoppingList(userId, newName, original.descripcion)

  // Copy items
  const items = await db
    .selectFrom('shopping_list_items')
    .selectAll()
    .where('shopping_list_id', '=', originalListId)
    .where('deleted_at', 'is', null)
    .orderBy('item_order', 'asc')
    .execute()

  // Bulk insert all items in a single query (performance optimization)
  if (items.length > 0) {
    await db
      .insertInto('shopping_list_items')
      .values(
        items.map((item) => ({
          shopping_list_id: newList.id,
          product_id: item.product_id,
          product_custom_id: item.product_custom_id,
          is_catalog: item.is_catalog,
          cantidad: item.cantidad,
          unidad_medida: item.unidad_medida,
          categoria_producto_id: item.categoria_producto_id,
          marca: item.marca,
          comentario: item.comentario,
          item_order: item.item_order,
          item_type: 'NORMAL' as const,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      )
      .execute()
  }

  return newList
}

// ============================================
// SHOPPING LIST ITEMS
// ============================================

export async function createShoppingListItem(data: {
  shopping_list_id: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  cantidad: number
  unidad_medida?: string
  categoria_producto_id?: string
  categoria_global_id?: string | null
  marca?: string
  comentario?: string
  item_order: number
  created_by: string
}) {
  // Insert the item and get the new ID
  const newItem = await db
    .insertInto('shopping_list_items')
    .values({
      ...data,
      item_type: 'NORMAL',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id'])
    .executeTakeFirstOrThrow()

  // Fetch the complete item with joins to get nombre and final_category_id
  const completeItem = await db
    .selectFrom('shopping_list_items')
    .leftJoin('product_catalog', 'shopping_list_items.product_id', 'product_catalog.id')
    .leftJoin('product_user_custom', 'shopping_list_items.product_custom_id', 'product_user_custom.id')
    .select([
      'shopping_list_items.id',
      'shopping_list_items.shopping_list_id',
      'shopping_list_items.product_id',
      'shopping_list_items.product_custom_id',
      'shopping_list_items.is_catalog',
      'shopping_list_items.cantidad',
      'shopping_list_items.unidad_medida',
      'shopping_list_items.categoria_producto_id',
      sql<string | null>`shopping_list_items.categoria_global_id`.as('categoria_global_id'),
      'shopping_list_items.marca',
      'shopping_list_items.comentario',
      'shopping_list_items.item_order',
      sql<string>`COALESCE(product_catalog.nombre, product_user_custom.nombre)`.as('nombre'),
      sql<string | null>`COALESCE(shopping_list_items.categoria_producto_id, shopping_list_items.categoria_global_id, product_catalog.category_id)`.as('final_category_id'),
    ])
    .where('shopping_list_items.id', '=', newItem.id)
    .executeTakeFirstOrThrow()

  return completeItem
}

export async function getShoppingListItems(listId: string) {
  return db
    .selectFrom('shopping_list_items')
    .leftJoin('product_catalog', 'shopping_list_items.product_id', 'product_catalog.id')
    .leftJoin('product_user_custom', 'shopping_list_items.product_custom_id', 'product_user_custom.id')
    .select([
      'shopping_list_items.id',
      'shopping_list_items.shopping_list_id',
      'shopping_list_items.product_id',
      'shopping_list_items.product_custom_id',
      'shopping_list_items.is_catalog',
      'shopping_list_items.cantidad',
      'shopping_list_items.unidad_medida',
      'shopping_list_items.categoria_producto_id',
      sql<string | null>`shopping_list_items.categoria_global_id`.as('categoria_global_id'),
      'shopping_list_items.marca',
      'shopping_list_items.comentario',
      'shopping_list_items.item_order',
      'shopping_list_items.item_type',
      'shopping_list_items.created_by',
      'shopping_list_items.created_at',
      'shopping_list_items.updated_at',
      'shopping_list_items.deleted_at',
      // Product names
      sql<string>`COALESCE(product_catalog.nombre, product_user_custom.nombre)`.as('nombre'),
      // Product category - Priority: user-assigned > global assigned > catalog category
      sql<string | null>`COALESCE(shopping_list_items.categoria_producto_id, shopping_list_items.categoria_global_id, product_catalog.category_id)`.as('final_category_id'),
    ])
    .where('shopping_list_items.shopping_list_id', '=', listId)
    .where('shopping_list_items.deleted_at', 'is', null)
    .orderBy('shopping_list_items.item_order', 'asc')
    .execute()
}

export async function updateShoppingListItem(
  id: string,
  updates: {
    cantidad?: number
    unidad_medida?: string
    categoria_producto_id?: string | null
    categoria_global_id?: string | null
    marca?: string
    comentario?: string
    item_order?: number
  }
) {
  return db
    .updateTable('shopping_list_items')
    .set({
      ...updates,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returning(['id', 'cantidad', 'item_order', 'updated_at'])
    .executeTakeFirst()
}

export async function deleteShoppingListItem(id: string) {
  return db
    .updateTable('shopping_list_items')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

export async function reorderShoppingListItems(listId: string, orderedIds: string[]) {
  // Use transaction for atomic updates
  return db.transaction().execute(async (trx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await trx
        .updateTable('shopping_list_items')
        .set({ item_order: i })
        .where('id', '=', orderedIds[i])
        .where('shopping_list_id', '=', listId)
        .execute()
    }
  })
}

// ============================================
// SHOPPING LIST COLLABORATORS
// ============================================

export async function addCollaborator(
  listId: string,
  userId: string,
  permissionLevel: 'FULL_ACCESS' | 'EXECUTION_ONLY',
  addedBy: string
) {
  return db
    .insertInto('shopping_list_collaborators')
    .values({
      shopping_list_id: listId,
      user_id: userId,
      permission_level: permissionLevel,
      added_by: addedBy,
      created_at: new Date(),
    })
    .returning(['id', 'user_id', 'permission_level'])
    .executeTakeFirstOrThrow()
}

export async function getListCollaborators(listId: string) {
  return db
    .selectFrom('shopping_list_collaborators')
    .selectAll()
    .where('shopping_list_id', '=', listId)
    .where('deleted_at', 'is', null)
    .execute()
}

export async function removeCollaborator(listId: string, userId: string) {
  return db
    .updateTable('shopping_list_collaborators')
    .set({ deleted_at: new Date() })
    .where('shopping_list_id', '=', listId)
    .where('user_id', '=', userId)
    .execute()
}

// ============================================
// SHOPPING EXECUTIONS
// ============================================

export async function createShoppingExecution(data: {
  shopping_list_id: string
  user_id: string
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  store_name?: string | null
  sobre_id?: string | null
  categoria_sobre_id?: string | null
  subcategoria_id?: string | null
  total_estimado?: number | null
  total_calculated?: number | null
  total_manual?: number | null
  tiempo_transcurrido?: number | null
  started_at?: Date
  completed_at?: Date | null
}) {
  const values: any = {
    shopping_list_id: data.shopping_list_id,
    user_id: data.user_id,
    status: data.status || 'IN_PROGRESS',
    started_at: data.started_at || new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  }

  // Add optional fields only if they are not undefined
  if (data.store_name !== undefined) values.store_name = data.store_name
  if (data.sobre_id !== undefined) values.sobre_id = data.sobre_id
  if (data.categoria_sobre_id !== undefined) values.categoria_sobre_id = data.categoria_sobre_id
  if (data.subcategoria_id !== undefined) values.subcategoria_id = data.subcategoria_id
  if (data.total_estimado !== undefined) values.total_estimado = data.total_estimado
  if (data.total_calculated !== undefined) values.total_calculated = data.total_calculated
  if (data.total_manual !== undefined) values.total_manual = data.total_manual
  if (data.tiempo_transcurrido !== undefined) values.tiempo_transcurrido = data.tiempo_transcurrido
  if (data.completed_at !== undefined) values.completed_at = data.completed_at

  return db
    .insertInto('shopping_executions')
    .values(values)
    .returning(['id', 'shopping_list_id', 'user_id', 'status', 'started_at'])
    .executeTakeFirstOrThrow()
}

export async function getShoppingExecution(id: string) {
  return db
    .selectFrom('shopping_executions')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function updateShoppingExecution(
  id: string,
  updates: {
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    total_estimado?: number
    total_calculated?: number
    total_manual?: number
    sobre_id?: string
    categoria_sobre_id?: string
    tiempo_transcurrido?: number
    gasto_id?: string
    completed_at?: Date
  }
) {
  return db
    .updateTable('shopping_executions')
    .set({
      ...updates,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returning(['id', 'status', 'total_calculated', 'updated_at'])
    .executeTakeFirst()
}

export async function getExecutionsByList(listId: string) {
  return db
    .selectFrom('shopping_executions')
    .selectAll()
    .where('shopping_list_id', '=', listId)
    .where('deleted_at', 'is', null)
    .orderBy('started_at', 'desc')
    .execute()
}

export async function getActiveExecutionsByUser(userId: string) {
  return db
    .selectFrom('shopping_executions as se')
    .leftJoin('users as u', 'se.user_id', 'u.id')
    .selectAll('se')
    .select([
      'u.name as executor_name',
      'u.email as executor_email',
    ])
    .where('se.user_id', '=', userId)
    .where('se.status', '=', 'IN_PROGRESS')
    .where('se.deleted_at', 'is', null)
    .orderBy('se.started_at', 'desc')
    .execute()
}

export async function getCompletedExecutionsByUser(userId: string, limit: number = 20) {
  // Get executions where:
  // 1. User executed them (user_id = userId)
  // 2. OR user owns the list and registered the execution (owner_registration_status = 'registered')

  const ownExecutions = await db
    .selectFrom('shopping_executions as se')
    .leftJoin('users as u', 'se.user_id', 'u.id')
    .selectAll('se')
    .select([
      'u.name as executor_name',
      'u.email as executor_email',
    ])
    .where('se.user_id', '=', userId)
    .where('se.status', '=', 'COMPLETED')
    .where('se.deleted_at', 'is', null)
    .orderBy('se.completed_at', 'desc')
    .execute()

  // Get executions registered by owner (from invited users)
  const registeredExecutions = await db
    .selectFrom('shopping_executions as se')
    .innerJoin('shopping_lists as sl', 'se.shopping_list_id', 'sl.id')
    .leftJoin('users as u', 'se.user_id', 'u.id')
    .selectAll('se')
    .select([
      'u.name as executor_name',
      'u.email as executor_email',
    ])
    .where('sl.user_id', '=', userId)
    .where('se.user_id', '!=', userId)
    .where('se.status', '=', 'COMPLETED')
    .where('se.owner_registration_status', '=', 'registered')
    .where('se.deleted_at', 'is', null)
    .orderBy('se.completed_at', 'desc')
    .execute()

  // Combine and sort by completed_at
  const allExecutions = [...ownExecutions, ...registeredExecutions]
    .sort((a, b) => {
      const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return bDate - aDate
    })
    .slice(0, limit)

  return allExecutions
}

// ============================================
// SHOPPING EXECUTION ITEMS
// ============================================

export async function createExecutionItem(data: {
  shopping_execution_id: string
  shopping_list_item_id?: string | null
  product_id?: string | null
  product_custom_id?: string | null
  is_catalog: boolean
  cantidad_comprada?: number
  unidad_medida?: string | null
  marca?: string | null
  precio_unitario?: number | null
  precio_total?: number | null
  es_comprado?: boolean
  razon_no_comprado?: 'SIN_STOCK' | 'NO_DISPONIBLE' | 'DESCARTADO' | null
  es_agregado_vuelo?: boolean
  agregado_por?: string | null
  categoria_producto_id?: string | null
  categoria_global_id?: string | null
}) {
  return db
    .insertInto('shopping_execution_items')
    .values({
      ...data,
      es_comprado: data.es_comprado ?? false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'shopping_execution_id', 'es_comprado'])
    .executeTakeFirstOrThrow()
}

export async function getExecutionItems(executionId: string) {
  return db
    .selectFrom('shopping_execution_items')
    .leftJoin('product_catalog', 'shopping_execution_items.product_id', 'product_catalog.id')
    .leftJoin('product_user_custom', 'shopping_execution_items.product_custom_id', 'product_user_custom.id')
    .leftJoin('product_categories_user', 'shopping_execution_items.categoria_producto_id', 'product_categories_user.id')
    .leftJoin('product_categories_global', 'shopping_execution_items.categoria_global_id', 'product_categories_global.id')
    .select([
      'shopping_execution_items.id',
      'shopping_execution_items.shopping_execution_id',
      'shopping_execution_items.shopping_list_item_id',
      'shopping_execution_items.product_id',
      'shopping_execution_items.product_custom_id',
      'shopping_execution_items.is_catalog',
      'shopping_execution_items.cantidad_comprada',
      'shopping_execution_items.unidad_medida',
      'shopping_execution_items.marca',
      'shopping_execution_items.precio_unitario',
      'shopping_execution_items.precio_total',
      'shopping_execution_items.es_comprado',
      'shopping_execution_items.razon_no_comprado',
      'shopping_execution_items.categoria_producto_id',
      'shopping_execution_items.categoria_global_id',
      'shopping_execution_items.created_at',
      'shopping_execution_items.updated_at',
      // Product name from catalog or custom products
      sql<string>`COALESCE(product_catalog.nombre, product_user_custom.nombre)`.as('product_name'),
      // Category name (user category takes precedence over global)
      sql<string | null>`COALESCE(product_categories_user.nombre, product_categories_global.nombre)`.as('categoria_producto_nombre'),
    ])
    .where('shopping_execution_id', '=', executionId)
    .execute()
}

export async function updateExecutionItem(
  id: string,
  updates: {
    cantidad_comprada?: number
    precio_unitario?: number
    precio_total?: number
    es_comprado?: boolean
    razon_no_comprado?: string | null
  }
) {
  return db
    .updateTable('shopping_execution_items')
    .set({
      ...updates,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returning(['id', 'es_comprado', 'precio_total', 'updated_at'])
    .executeTakeFirst()
}

// ============================================
// PRODUCT CATALOG
// ============================================

export async function searchProductCatalog(
  nombre: string,
  idioma: string = 'es',
  limit: number = 20
) {
  return db
    .selectFrom('product_catalog')
    .selectAll()
    .where('idioma', '=', idioma)
    .where('deleted_at', 'is', null)
    .where('nombre', 'ilike', `%${nombre}%`)
    .orderBy('nombre', 'asc')
    .limit(limit)
    .execute()
}

export async function getProductCatalogById(id: string) {
  return db
    .selectFrom('product_catalog')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Obtener todos los productos del catálogo por idioma (para caché)
 */
export async function getAllProductCatalogByIdioma(idioma: string = 'es') {
  return db
    .selectFrom('product_catalog')
    .selectAll()
    .where('idioma', '=', idioma)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

// ============================================
// PRODUCT USER CUSTOM
// ============================================

export async function createCustomProduct(
  userId: string,
  nombre: string,
  descripcion?: string
) {
  return db
    .insertInto('product_user_custom')
    .values({
      user_id: userId,
      nombre,
      descripcion,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'nombre', 'user_id'])
    .executeTakeFirstOrThrow()
}

export async function searchUserCustomProducts(
  userId: string,
  nombre: string,
  limit: number = 20
) {
  return db
    .selectFrom('product_user_custom')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .where('nombre', 'ilike', `%${nombre}%`)
    .orderBy('nombre', 'asc')
    .limit(limit)
    .execute()
}

/**
 * Buscar producto custom por nombre exacto (para evitar duplicados)
 */
export async function findUserCustomProductByNombre(
  userId: string,
  nombre: string
) {
  return db
    .selectFrom('product_user_custom')
    .selectAll()
    .where('user_id', '=', userId)
    .where((eb: any) => eb(eb.fn('LOWER', ['nombre']), '=', nombre.toLowerCase()))
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Obtener todos los productos custom del usuario (para caché)
 */
export async function getAllUserCustomProducts(userId: string) {
  return db
    .selectFrom('product_user_custom')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

// ============================================
// PRODUCT FAVORITES
// ============================================

export async function addFavorite(
  userId: string,
  productId: string | null,
  productCustomId: string | null,
  isCatalog: boolean
) {
  return db
    .insertInto('product_favorites')
    .values({
      user_id: userId,
      product_id: productId,
      product_custom_id: productCustomId,
      is_catalog: isCatalog,
      created_at: new Date(),
    })
    .execute()
}

export async function removeFavorite(userId: string, productId: string) {
  return db
    .updateTable('product_favorites')
    .set({ deleted_at: new Date() })
    .where('user_id', '=', userId)
    .where((eb) =>
      eb('product_id', '=', productId).or('product_custom_id', '=', productId)
    )
    .execute()
}

export async function getFavorites(userId: string) {
  return db
    .selectFrom('product_favorites')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .execute()
}

// ============================================
// PRODUCT FREQUENCY
// ============================================

export async function getFrequentProducts(userId: string, limit: number = 10) {
  return db
    .selectFrom('product_frequency')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('count_purchases', 'desc')
    .orderBy('last_purchase_date', 'desc')
    .limit(limit)
    .execute()
}

export async function incrementProductFrequency(
  userId: string,
  productId: string,
  productCustomId: string | null,
  isCatalog: boolean
) {
  const existing = await db
    .selectFrom('product_frequency')
    .selectAll()
    .where('user_id', '=', userId)
    .where(
      isCatalog
        ? eb => eb('product_id', '=', productId)
        : eb => eb('product_custom_id', '=', productCustomId)
    )
    .executeTakeFirst()

  if (existing) {
    return db
      .updateTable('product_frequency')
      .set({
        count_purchases: existing.count_purchases + 1,
        last_purchase_date: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', existing.id)
      .execute()
  } else {
    return db
      .insertInto('product_frequency')
      .values({
        user_id: userId,
        product_id: isCatalog ? productId : null,
        product_custom_id: !isCatalog ? productCustomId : null,
        is_catalog: isCatalog,
        count_purchases: 1,
        last_purchase_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute()
  }
}

// ============================================
// PRODUCT PRICE HISTORY
// ============================================

export async function recordPrice(data: {
  user_id: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  store_name: string
  price: number
  currency_id?: string
}) {
  return db
    .insertInto('product_prices_history')
    .values({
      ...data,
      recorded_at: new Date(),
    })
    .execute()
}

export async function getPriceHistory(
  productId: string,
  storeNames?: string[],
  limit: number = 10
) {
  let query = db
    .selectFrom('product_prices_history')
    .selectAll()
    .where('product_id', '=', productId)
    .orderBy('recorded_at', 'desc')
    .limit(limit)

  if (storeNames && storeNames.length > 0) {
    query = query.where('store_name', 'in', storeNames)
  }

  return query.execute()
}

// ============================================
// PRODUCT CATEGORIES USER
// ============================================

export async function createProductCategory(
  userId: string,
  nombre: string,
  color?: string,
  emoji?: string
) {
  return db
    .insertInto('product_categories_user')
    .values({
      user_id: userId,
      nombre,
      color,
      emoji,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'nombre', 'color', 'emoji'])
    .executeTakeFirstOrThrow()
}

export async function getUserProductCategories(userId: string) {
  return db
    .selectFrom('product_categories_user')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

/**
 * Buscar categoría por nombre exacto (para evitar duplicados)
 */
export async function findUserProductCategoryByNombre(
  userId: string,
  nombre: string
) {
  return db
    .selectFrom('product_categories_user')
    .selectAll()
    .where('user_id', '=', userId)
    .where((eb: any) => eb(eb.fn('LOWER', ['nombre']), '=', nombre.toLowerCase()))
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

// ============================================
// GLOBAL PRODUCT CATEGORIES
// ============================================

export async function getGlobalProductCategories() {
  return db
    .selectFrom('product_categories_global')
    .selectAll()
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

/**
 * Obtener todas las categorías globales por idioma (para caché)
 */
export async function getAllGlobalProductCategoriesByIdioma(idioma: string = 'es') {
  return db
    .selectFrom('product_categories_global')
    .selectAll()
    .where('idioma', '=', idioma)
    .where('deleted_at', 'is', null)
    .orderBy('nombre', 'asc')
    .execute()
}

export async function getGlobalProductCategoryById(id: string) {
  return db
    .selectFrom('product_categories_global')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

// ============================================
// INVITACIONES DE LISTAS
// ============================================

/**
 * Crear invitación para compartir lista
 */
export async function createInvitacionLista(data: {
  lista_id: string
  invitado_por_id: string
  invitado_email_o_telefono: string
  invitado_user_id?: string | null
  codigo_invitacion?: string | null
  rol: RolListaUsuario
}) {
  return await db
    .insertInto('invitaciones_listas')
    .values({
      ...data,
      estado: 'PENDIENTE',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar invitación por código único
 */
export async function findInvitacionListaByCodigo(codigo: string) {
  return await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .innerJoin('users as inviter', 'inviter.id', 'inv.invitado_por_id')
    .select([
      'inv.id',
      'inv.lista_id',
      'inv.rol',
      'inv.estado',
      'inv.expires_at',
      'lista.nombre as lista_nombre',
      'lista.descripcion as lista_descripcion',
      'inviter.name as inviter_name',
      'inviter.email as inviter_email',
      'inviter.image as inviter_image',
    ])
    .where('inv.codigo_invitacion', '=', codigo)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .executeTakeFirst()
}

/**
 * Buscar invitaciones pendientes por email/teléfono
 */
export async function findInvitacionesListasPendientesByContact(
  emailOrPhone: string
): Promise<Array<{ lista_nombre: string; lista_id: string; invitacion_id: string }>> {
  const contact = emailOrPhone.toLowerCase().trim()

  return await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .select([
      'lista.nombre as lista_nombre',
      'lista.id as lista_id',
      'inv.id as invitacion_id',
    ])
    .where('inv.invitado_email_o_telefono', '=', contact)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .where('lista.deleted_at', 'is', null)
    .execute()
}

/**
 * Buscar invitaciones pendientes de un usuario (ya registrado)
 */
export async function findInvitacionesListasPendientesByUser(userId: string) {
  return await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .innerJoin('users as inviter', 'inviter.id', 'inv.invitado_por_id')
    .select([
      'inv.id',
      'inv.lista_id',
      'inv.rol',
      'inv.created_at',
      'inv.expires_at',
      'lista.nombre as lista_nombre',
      'lista.descripcion as lista_descripcion',
      'inviter.name as inviter_name',
      'inviter.email as inviter_email',
      'inviter.image as inviter_image',
    ])
    .where('inv.invitado_user_id', '=', userId)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .orderBy('inv.created_at', 'desc')
    .execute()
}

/**
 * Buscar invitaciones enviadas por un usuario (todas sus invitaciones)
 */
export async function findInvitacionesListasEnviadasByUser(userId: string) {
  return await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .leftJoin('users', 'users.id', 'inv.invitado_user_id')
    .select([
      'inv.id',
      'inv.lista_id',
      'inv.invitado_email_o_telefono',
      'inv.estado',
      'inv.rol',
      'inv.created_at',
      'inv.expires_at',
      'inv.codigo_invitacion',
      'inv.invitado_user_id',
      'lista.nombre as lista_nombre',
      'lista.descripcion as lista_descripcion',
      'users.name as invitado_name',
      'users.email as invitado_email',
      'users.image as invitado_image',
    ])
    .where('inv.invitado_por_id', '=', userId)
    .where('inv.estado', '!=', 'CANCELADA')
    .where('lista.deleted_at', 'is', null)
    .orderBy('inv.created_at', 'desc')
    .execute()
}

export async function findInvitacionesListasByLista(listaId: string) {
  return await db
    .selectFrom('invitaciones_listas as inv')
    .leftJoin('users as invitado', 'invitado.id', 'inv.invitado_user_id')
    .select([
      'inv.id',
      'inv.lista_id',
      'inv.invitado_email_o_telefono',
      'inv.estado',
      'inv.rol',
      'inv.created_at',
      'inv.updated_at',
      'inv.expires_at',
      'inv.invitado_user_id',
      'invitado.name as invitado_name',
      'invitado.email as invitado_email',
      'invitado.image as invitado_image',
    ])
    .where('inv.lista_id', '=', listaId)
    .where('inv.estado', 'in', ['PENDIENTE', 'ACEPTADA'])
    .orderBy('inv.created_at', 'desc')
    .execute()
}

/**
 * Obtener invitación por ID
 */
export async function findInvitacionListaById(invitacionId: string) {
  return await db
    .selectFrom('invitaciones_listas')
    .select([
      'id',
      'lista_id',
      'invitado_por_id',
      'invitado_user_id',
      'estado',
    ])
    .where('id', '=', invitacionId)
    .executeTakeFirst()
}

/**
 * Aceptar invitación y agregar como colaborador
 */
export async function acceptInvitacionLista(invitacionId: string, userId: string) {
  // 1. Obtener datos de invitación
  const inv = await db
    .selectFrom('invitaciones_listas')
    .selectAll()
    .where('id', '=', invitacionId)
    .executeTakeFirstOrThrow()

  // 2. Obtener lista
  const lista = await getShoppingListById(inv.lista_id)
  if (!lista) throw new Error('Lista no encontrada')

  // 3. Actualizar estado de invitación
  await db
    .updateTable('invitaciones_listas')
    .set({
      estado: 'ACEPTADA',
      invitado_user_id: userId,
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  // 4. Agregar como colaborador
  const colaborador = await addCollaborator(
    inv.lista_id,
    userId,
    inv.rol as any,
    inv.invitado_por_id
  )

  return {
    invitacion: inv,
    lista,
    colaborador,
  }
}

/**
 * Rechazar invitación
 */
export async function rejectInvitacionLista(invitacionId: string) {
  // Obtener datos antes de rechazar
  const invitacion = await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .select([
      'inv.id',
      'inv.invitado_user_id',
      'inv.invitado_email_o_telefono',
      'lista.nombre as lista_nombre',
    ])
    .where('inv.id', '=', invitacionId)
    .executeTakeFirst()

  // Marcar como rechazada
  await db
    .updateTable('invitaciones_listas')
    .set({
      estado: 'RECHAZADA',
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  return invitacion
}

/**
 * Cancelar invitación (por el que invitó)
 */
export async function cancelInvitacionLista(invitacionId: string, userId: string) {
  // Verificar que sea el owner de la lista
  const inv = await db
    .selectFrom('invitaciones_listas as inv')
    .innerJoin('shopping_lists as lista', 'lista.id', 'inv.lista_id')
    .select(['inv.id', 'lista.user_id'])
    .where('inv.id', '=', invitacionId)
    .executeTakeFirst()

  if (!inv) throw new Error('Invitación no encontrada')
  if (inv.user_id !== userId) throw new Error('No tienes permiso para cancelar esta invitación')

  return await db
    .updateTable('invitaciones_listas')
    .set({
      estado: 'CANCELADA',
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()
}

/**
 * Actualizar rol de invitación
 */
export async function updateInvitacionListaRole(
  invitacionId: string,
  newRole: string,
  invitadoUserId?: string | null
) {
  // 1. Actualizar rol en invitaciones_listas
  await db
    .updateTable('invitaciones_listas')
    .set({
      rol: newRole as any,
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  // 2. Si la invitación fue aceptada y existe usuario, actualizar también en shopping_list_collaborators
  if (invitadoUserId) {
    const invitacion = await db
      .selectFrom('invitaciones_listas')
      .select(['lista_id', 'estado'])
      .where('id', '=', invitacionId)
      .executeTakeFirst()

    if (invitacion && invitacion.estado === 'ACEPTADA') {
      await db
        .updateTable('shopping_list_collaborators')
        .set({
          permission_level: newRole as any,
        })
        .where('shopping_list_id', '=', invitacion.lista_id)
        .where('user_id', '=', invitadoUserId)
        .execute()
    }
  }
}

/**
 * Obtener participantes de una lista (colaboradores)
 */
export async function findParticipantesByLista(listaId: string) {
  return await db
    .selectFrom('shopping_list_collaborators as slc')
    .innerJoin('users', 'users.id', 'slc.user_id')
    .select([
      'slc.id',
      'slc.shopping_list_id',
      'slc.user_id as usuario_id',
      'slc.permission_level as rol',
      'slc.created_at',
      'users.name as usuario_nombre',
      'users.email as usuario_email',
      'users.image as usuario_image',
    ])
    .where('slc.shopping_list_id', '=', listaId)
    .where('slc.deleted_at', 'is', null)
    .execute()
}

/**
 * Actualizar rol de participante
 */
export async function updateParticipanteListaRole(
  listaId: string,
  userId: string,
  newRole: string
) {
  return await db
    .updateTable('shopping_list_collaborators')
    .set({
      permission_level: newRole as any,
    })
    .where('shopping_list_id', '=', listaId)
    .where('user_id', '=', userId)
    .execute()
}
