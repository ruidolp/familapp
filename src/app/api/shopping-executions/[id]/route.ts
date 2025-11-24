import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import {
  getShoppingExecution,
  updateShoppingExecution,
  getExecutionItems,
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

    if (execution.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta ejecución' },
        { status: 403 }
      )
    }

    const items = await getExecutionItems(id)

    // Get sobre, categoria, and subcategoria names if they exist
    let sobreInfo = null
    let categoriaInfo = null
    let marcaInfo = null

    if (execution.sobre_id) {
      const sobre = await db
        .selectFrom('sobres')
        .select(['id', 'nombre', 'emoji'])
        .where('id', '=', execution.sobre_id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()
      sobreInfo = sobre || null
    }

    if (execution.categoria_sobre_id) {
      const categoria = await db
        .selectFrom('categorias_sobre')
        .select(['id', 'nombre', 'emoji'])
        .where('id', '=', execution.categoria_sobre_id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()
      categoriaInfo = categoria || null
    }

    if (execution.subcategoria_id) {
      const marca = await db
        .selectFrom('subcategorias_sobre')
        .select(['id', 'nombre', 'emoji'])
        .where('id', '=', execution.subcategoria_id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()
      marcaInfo = marca || null
    }

    // Calculate totals
    const totalCalculated = items.reduce((sum: number, item: any) => {
      if (item.es_comprado && item.precio_total) {
        return sum + Number(item.precio_total)
      }
      return sum
    }, 0)

    return NextResponse.json({
      success: true,
      execution: {
        ...execution,
        sobre_info: sobreInfo,
        categoria_info: categoriaInfo,
        marca_info: marcaInfo,
      },
      items,
      totalCalculated,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-executions/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ejecución' },
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
    const {
      status,
      total_estimado,
      total_calculated,
      total_manual,
      sobre_id,
      categoria_sobre_id,
      tiempo_transcurrido,
      gasto_id,
    } = body

    const updated = await updateShoppingExecution(id, {
      status,
      total_estimado,
      total_calculated,
      total_manual,
      sobre_id,
      categoria_sobre_id,
      tiempo_transcurrido,
      gasto_id,
      completed_at: status === 'COMPLETED' ? new Date() : undefined,
    })

    // If execution is being marked as COMPLETED, increment the purchase_count of the shopping list
    if (status === 'COMPLETED') {
      await db
        .updateTable('shopping_lists')
        .set(eb => ({
          purchase_count: eb('purchase_count', '+', 1),
          updated_at: new Date(),
        }))
        .where('id', '=', execution.shopping_list_id)
        .execute()
    }

    return NextResponse.json({
      success: true,
      execution: updated,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/shopping-executions/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar ejecución' },
      { status: 500 }
    )
  }
}
