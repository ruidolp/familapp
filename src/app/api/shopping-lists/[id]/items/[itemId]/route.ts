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
    })

    const updatedItem = await updateShoppingListItem(itemId, {
      cantidad: cantidad !== undefined ? cantidad : undefined,
      unidad_medida: unidad_medida !== undefined ? unidad_medida : undefined,
      categoria_producto_id:
        categoria_producto_id !== undefined ? categoria_producto_id : undefined,
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
