import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  createShoppingListItem,
  getShoppingListItems,
  reorderShoppingListItems,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { getUserPermissionForList } from '@/application/services/shopping-lists.service'

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

    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Check user permission (OWNER, EDITOR, or EXECUTION_ONLY can view items)
    const userPermission = await getUserPermissionForList(id, userId)
    if (!userPermission) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta lista' },
        { status: 403 }
      )
    }

    const items = await getShoppingListItems(id)

    return NextResponse.json({
      success: true,
      items,
      total: items.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener items' },
      { status: 500 }
    )
  }
}

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

    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Check user permission (OWNER or EDITOR can add items)
    const userPermission = await getUserPermissionForList(id, userId)
    if (!userPermission || userPermission === 'EXECUTION_ONLY') {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta lista' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      product_id,
      product_custom_id,
      is_catalog,
      cantidad,
      unidad_medida,
      categoria_producto_id,
      categoria_global_id,
      marca,
      comentario,
    } = body

    // Get current items
    const items = await getShoppingListItems(id)

    // Check for duplicates
    const isDuplicate = items.some((item: any) => {
      if (is_catalog && product_id) {
        return item.product_id === product_id
      } else if (!is_catalog && product_custom_id) {
        return item.product_custom_id === product_custom_id
      }
      return false
    })

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Este producto ya está en la lista' },
        { status: 400 }
      )
    }

    // Get next order
    const nextOrder = Math.max(0, ...items.map((i: any) => i.item_order || 0)) + 1

    const newItem = await createShoppingListItem({
      shopping_list_id: id,
      product_id,
      product_custom_id,
      is_catalog,
      cantidad: cantidad || 1,
      unidad_medida,
      categoria_producto_id,
      categoria_global_id,
      marca,
      comentario,
      item_order: nextOrder,
      created_by: session.user.id,
    })

    return NextResponse.json({
      success: true,
      item: newItem,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear item' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Check user permission (OWNER or EDITOR can reorder items)
    const userPermission = await getUserPermissionForList(id, userId)
    if (!userPermission || userPermission === 'EXECUTION_ONLY') {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta lista' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds debe ser un array' },
        { status: 400 }
      )
    }

    await reorderShoppingListItems(id, orderedIds)

    return NextResponse.json({
      success: true,
      message: 'Items reordenados correctamente',
    })
  } catch (error: any) {
    console.error('❌ PUT /api/shopping-lists/[id]/items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al reordenar items' },
      { status: 500 }
    )
  }
}
