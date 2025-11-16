import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  updateShoppingList,
  softDeleteShoppingList,
  getShoppingListItems,
} from '@/infrastructure/database/queries/shopping-lists.queries'

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

    const list = await getShoppingListById(id)
    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta lista' },
        { status: 403 }
      )
    }

    // Get items
    const items = await getShoppingListItems(id)

    return NextResponse.json({
      success: true,
      list,
      items,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener lista' },
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
    const list = await getShoppingListById(id)

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

    const body = await req.json()
    const { nombre, descripcion, list_order } = body

    const updated = await updateShoppingList(id, {
      nombre,
      descripcion,
      list_order,
    })

    return NextResponse.json({
      success: true,
      list: updated,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/shopping-lists/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar lista' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta lista' },
        { status: 403 }
      )
    }

    await softDeleteShoppingList(id)

    return NextResponse.json({
      success: true,
      message: 'Lista eliminada correctamente',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/shopping-lists/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar lista' },
      { status: 500 }
    )
  }
}
