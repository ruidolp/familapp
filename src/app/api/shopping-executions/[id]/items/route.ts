import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingExecution,
  getExecutionItems,
  updateExecutionItem,
  createExecutionItem,
  getShoppingListById,
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
    const execution = await getShoppingExecution(id)

    if (!execution) {
      return NextResponse.json(
        { error: 'Ejecución no encontrada' },
        { status: 404 }
      )
    }

    const isExecutor = execution.user_id === session.user.id
    let isListOwner = false

    if (!isExecutor) {
      const list = await getShoppingListById(execution.shopping_list_id)
      isListOwner = !!list && list.user_id === session.user.id
    }

    if (!isExecutor && !isListOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta ejecución' },
        { status: 403 }
      )
    }

    const items = await getExecutionItems(id)

    return NextResponse.json({
      success: true,
      items,
      total: items.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-executions/[id]/items error:', error)
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
    const execution = await getShoppingExecution(id)

    if (!execution) {
      return NextResponse.json(
        { error: 'Ejecución no encontrada' },
        { status: 404 }
      )
    }

    if (execution.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta ejecución' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      product_id,
      product_custom_id,
      is_catalog,
      cantidad_comprada,
      unidad_medida,
      marca,
    } = body

    // Add item during execution (producto agregado al vuelo)
    const newItem = await createExecutionItem({
      shopping_execution_id: id,
      product_id,
      product_custom_id,
      is_catalog,
      cantidad_comprada,
      unidad_medida,
      marca,
      es_agregado_vuelo: true,
      agregado_por: session.user.id,
    })

    return NextResponse.json({
      success: true,
      item: newItem,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-executions/[id]/items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al agregar item' },
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
    const execution = await getShoppingExecution(id)

    if (!execution) {
      return NextResponse.json(
        { error: 'Ejecución no encontrada' },
        { status: 404 }
      )
    }

    if (execution.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta ejecución' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { itemId, updates } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId es requerido' },
        { status: 400 }
      )
    }

    const updated = await updateExecutionItem(itemId, updates)

    return NextResponse.json({
      success: true,
      item: updated,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/shopping-executions/[id]/items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar item' },
      { status: 500 }
    )
  }
}
