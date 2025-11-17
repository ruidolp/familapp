import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  createShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  reorderShoppingListItems,
} from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * POST /api/shopping-lists/[id]/items/batch
 *
 * Batch endpoint for autosave functionality.
 * Handles multiple operations in a single request to minimize API calls.
 *
 * Request body:
 * {
 *   creates?: Array<{
 *     product_id?: string,
 *     product_custom_id?: string,
 *     is_catalog: boolean,
 *     cantidad?: number,
 *     unidad_medida?: string,
 *     categoria_producto_id?: string,
 *     marca?: string,
 *     comentario?: string,
 *     item_order: number,
 *   }>,
 *   updates?: Array<{
 *     id: string,
 *     cantidad?: number,
 *     unidad_medida?: string,
 *     categoria_producto_id?: string,
 *     marca?: string,
 *     comentario?: string,
 *     item_order?: number,
 *   }>,
 *   deletes?: string[], // Array of item IDs to delete
 *   reorder?: string[], // Array of all item IDs in new order
 * }
 *
 * Response:
 * {
 *   success: true,
 *   created: number,
 *   updated: number,
 *   deleted: number,
 *   reordered: boolean,
 * }
 */
export async function POST(
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

    // Verify ownership
    const list = await getShoppingListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta lista' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const {
      creates = [],
      updates = [],
      deletes = [],
      reorder = null,
    } = body

    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0
    let reordered = false

    // Process creates
    for (const item of creates) {
      await createShoppingListItem({
        shopping_list_id: id,
        product_id: item.product_id,
        product_custom_id: item.product_custom_id,
        is_catalog: item.is_catalog,
        cantidad: item.cantidad ?? 1,
        unidad_medida: item.unidad_medida,
        categoria_producto_id: item.categoria_producto_id,
        marca: item.marca,
        comentario: item.comentario,
        item_order: item.item_order,
        created_by: userId,
      })
      createdCount++
    }

    // Process updates
    for (const item of updates) {
      const { id: itemId, ...updateData } = item
      await updateShoppingListItem(itemId, updateData)
      updatedCount++
    }

    // Process deletes
    for (const itemId of deletes) {
      await deleteShoppingListItem(itemId)
      deletedCount++
    }

    // Process reorder (if provided)
    if (reorder && Array.isArray(reorder) && reorder.length > 0) {
      await reorderShoppingListItems(id, reorder)
      reordered = true
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount,
      reordered,
      message: `Batch operation completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted${reordered ? ', reordered' : ''}`,
    })

  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/items/batch error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar operaciones en lote' },
      { status: 500 }
    )
  }
}
