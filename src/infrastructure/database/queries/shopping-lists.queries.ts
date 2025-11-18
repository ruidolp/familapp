import { db } from '../kysely'
import { sql } from 'kysely'

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
  marca?: string
  comentario?: string
  item_order: number
  created_by: string
}) {
  return db
    .insertInto('shopping_list_items')
    .values({
      ...data,
      item_type: 'NORMAL',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'shopping_list_id', 'product_id', 'cantidad', 'item_order'])
    .executeTakeFirstOrThrow()
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
    categoria_producto_id?: string
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
  store_name: string
  sobre_id?: string
}) {
  return db
    .insertInto('shopping_executions')
    .values({
      ...data,
      status: 'IN_PROGRESS',
      started_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
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
  es_agregado_vuelo?: boolean
  agregado_por?: string | null
}) {
  return db
    .insertInto('shopping_execution_items')
    .values({
      ...data,
      es_comprado: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'shopping_execution_id', 'es_comprado'])
    .executeTakeFirstOrThrow()
}

export async function getExecutionItems(executionId: string) {
  return db
    .selectFrom('shopping_execution_items')
    .selectAll()
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

// ============================================
// GLOBAL PRODUCT CATEGORIES
// ============================================
// NOTE: Temporarily disabled until migration is executed
// Run: psql -U user -d database -f src/infrastructure/database/migrations/011_add_global_product_categories.sql
// Then: npm run db:types

// export async function getGlobalProductCategories() {
//   return db
//     .selectFrom('product_categories_global')
//     .selectAll()
//     .where('deleted_at', 'is', null)
//     .orderBy('nombre', 'asc')
//     .execute()
// }

// export async function getGlobalProductCategoryById(id: string) {
//   return db
//     .selectFrom('product_categories_global')
//     .selectAll()
//     .where('id', '=', id)
//     .where('deleted_at', 'is', null)
//     .executeTakeFirst()
// }

