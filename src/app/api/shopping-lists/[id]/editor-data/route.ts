import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  getShoppingListItems,
  searchProductCatalog,
  searchUserCustomProducts,
  getUserProductCategories,
  getGlobalProductCategories,
  getFavorites,
  getFrequentProducts,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { getUserPermissionForList } from '@/application/services/shopping-lists.service'

/**
 * GET /api/shopping-lists/[id]/editor-data
 *
 * Unified endpoint that loads ALL data needed for the shopping list editor
 * in a single request to minimize API calls and reduce costs.
 *
 * Returns:
 * - catalog: All global products (filtered by user's language)
 * - customProducts: All user's custom products
 * - categoriesGlobal: All global categories (admin-created, read-only)
 * - categoriesUser: All user's custom categories (editable)
 * - items: Current list items
 * - listInfo: Basic list information (id, nombre, descripcion, purchase_count)
 * - favorites: User's favorite products
 * - frequent: User's most frequently used products
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const userId = session.user.id

    // Get list and verify access (owner or collaborator)
    const list = await getShoppingListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Check user permission (OWNER, EDITOR, or EXECUTION_ONLY)
    const userPermission = await getUserPermissionForList(id, userId)
    if (!userPermission) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta lista' },
        { status: 403 }
      )
    }

    const isOwner = list.user_id === userId
    const userRole = isOwner ? 'OWNER' : userPermission

    // Load all data in parallel to minimize latency
    const [
      items,
      catalog,
      customProducts,
      categoriesUser,
      categoriesGlobal,
      favorites,
      frequent,
    ] = await Promise.all([
      // List items
      getShoppingListItems(id),

      // Product catalog - get ALL products (no search filter)
      // We load everything once and filter in memory
      searchProductCatalog('', 'es', 10000), // High limit to get all

      // User's custom products - get ALL
      searchUserCustomProducts(userId, '', 10000),

      // User's custom product categories
      getUserProductCategories(userId),

      // Global product categories (admin-created, read-only)
      getGlobalProductCategories(),

      // User's favorites
      getFavorites(userId),

      // Most frequently used products
      getFrequentProducts(userId, 50),
    ])

    // Combine categories for easier use in frontend, marking each as type
    const categories = [
      ...categoriesGlobal.map((cat) => ({ ...cat, _type: 'global' as const })),
      ...categoriesUser.map((cat) => ({ ...cat, _type: 'user' as const })),
    ]

    // Build response with all data
    const response = {
      success: true,

      // List basic info
      listInfo: {
        id: list.id,
        nombre: list.nombre,
        descripcion: list.descripcion,
        purchase_count: list.purchase_count || 0,
        created_at: list.created_at,
        updated_at: list.updated_at,
        user_role: userRole, // User's role in this list
        is_owner: isOwner, // Whether user is the owner
      },

      // Current list items
      items,

      // Product catalog (global products)
      catalog,

      // User's custom products
      customProducts,

      // Combined categories (global + user) - for easier frontend use
      categories,

      // Global product categories (admin-created, read-only)
      categoriesGlobal,

      // User's custom product categories (editable)
      categoriesUser,

      // User's favorites
      favorites,

      // Most frequently used products
      frequent,

      // Stats for debugging
      _stats: {
        totalCatalogProducts: catalog.length,
        totalCustomProducts: customProducts.length,
        totalGlobalCategories: categoriesGlobal.length,
        totalUserCategories: categoriesUser.length,
        totalCategories: categories.length,
        totalItems: items.length,
        totalFavorites: favorites.length,
        totalFrequent: frequent.length,
      },
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/editor-data error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cargar datos del editor' },
      { status: 500 }
    )
  }
}
