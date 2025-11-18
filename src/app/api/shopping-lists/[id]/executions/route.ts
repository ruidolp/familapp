import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  createShoppingExecution,
  getExecutionsByList,
  getShoppingListItems,
  createExecutionItem,
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

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta lista' },
        { status: 403 }
      )
    }

    const executions = await getExecutionsByList(id)

    return NextResponse.json({
      success: true,
      executions,
      total: executions.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/executions error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ejecuciones' },
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
    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ejecutar esta lista' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { store_name, sobre_id } = body

    if (!store_name) {
      return NextResponse.json(
        { error: 'store_name es requerido' },
        { status: 400 }
      )
    }

    // Create execution
    const execution = await createShoppingExecution({
      shopping_list_id: id,
      user_id: session.user.id,
      store_name,
      sobre_id,
    })

    // Create execution items from list items
    const listItems = await getShoppingListItems(id)
    for (const item of listItems) {
      await createExecutionItem({
        shopping_execution_id: execution.id,
        shopping_list_item_id: item.id,
        product_id: item.product_id,
        product_custom_id: item.product_custom_id,
        is_catalog: item.is_catalog,
        cantidad_comprada: typeof item.cantidad === 'number' ? item.cantidad : parseFloat(item.cantidad),
        unidad_medida: item.unidad_medida,
        marca: item.marca,
      })
    }

    return NextResponse.json({
      success: true,
      execution,
      message: 'Ejecución iniciada correctamente',
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/executions error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar ejecución' },
      { status: 500 }
    )
  }
}
