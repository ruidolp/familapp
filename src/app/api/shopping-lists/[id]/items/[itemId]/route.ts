import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  updateShoppingListItem,
  deleteShoppingListItem,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { db } from '@/infrastructure/database/kysely'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listId, itemId } = await context.params
    const list = await getShoppingListById(listId)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta lista' },
        { status: 403 }
      )
    }

    // Verify item exists and belongs to this list
    const item = await db
      .selectFrom('shopping_list_items')
      .selectAll()
      .where('id', '=', itemId)
      .where('shopping_list_id', '=', listId)
      .executeTakeFirst()

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { cantidad, unidad_medida, categoria_producto_id, marca, comentario } =
      body

    console.log('📥 SERVER RECEIVED PUT:', {
      itemId,
      listId,
      body,
      cantidad,
      currentCantidadInDB: item.cantidad,
      categoriaProductoId: categoria_producto_id,
    })

    // Validate and determine which category table the ID belongs to
    let categoria_usuario_id: string | null = null
    let categoria_global_id: string | null = null

    if (categoria_producto_id) {
      // Check if category exists in user categories
      const userCategory = await db
        .selectFrom('product_categories_user')
        .select('id')
        .where('id', '=', categoria_producto_id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()

      if (userCategory) {
        categoria_usuario_id = categoria_producto_id
        console.log('✅ Category is user category:', categoria_usuario_id)
      } else {
        // Check if category exists in global categories
        const globalCategory = await db
          .selectFrom('product_categories_global')
          .select('id')
          .where('id', '=', categoria_producto_id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst()

        if (globalCategory) {
          categoria_global_id = categoria_producto_id
          console.log('✅ Category is global category:', categoria_global_id)
        } else {
          console.warn('⚠️ Category not found in either table:', categoria_producto_id)
          return NextResponse.json(
            { error: 'La categoría especificada no existe' },
            { status: 400 }
          )
        }
      }
    }

    const updatedItem = await updateShoppingListItem(itemId, {
      cantidad: cantidad !== undefined ? cantidad : undefined,
      unidad_medida: unidad_medida !== undefined ? unidad_medida : undefined,
      categoria_producto_id: categoria_usuario_id !== undefined ? categoria_usuario_id : undefined,
      categoria_global_id: categoria_global_id !== undefined ? categoria_global_id : undefined,
      marca: marca !== undefined ? marca : undefined,
      comentario: comentario !== undefined ? comentario : undefined,
    })

    console.log('✅ SERVER SAVED ITEM:', {
      itemId,
      updatedItem,
    })

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/shopping-lists/[id]/items/[itemId] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listId, itemId } = await context.params
    const list = await getShoppingListById(listId)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta lista' },
        { status: 403 }
      )
    }

    // Verify item exists and belongs to this list
    const item = await db
      .selectFrom('shopping_list_items')
      .selectAll()
      .where('id', '=', itemId)
      .where('shopping_list_id', '=', listId)
      .executeTakeFirst()

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    await deleteShoppingListItem(itemId)

    return NextResponse.json({
      success: true,
      message: 'Item eliminado correctamente',
    })
  } catch (error: any) {
    console.error(
      '❌ DELETE /api/shopping-lists/[id]/items/[itemId] error:',
      error
    )
    return NextResponse.json(
      { error: error.message || 'Error al eliminar item' },
      { status: 500 }
    )
  }
}
