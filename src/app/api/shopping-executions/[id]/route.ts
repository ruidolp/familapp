import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
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

    // Calculate totals
    const totalCalculated = items.reduce((sum: number, item: any) => {
      if (item.es_comprado && item.precio_total) {
        return sum + Number(item.precio_total)
      }
      return sum
    }, 0)

    return NextResponse.json({
      success: true,
      execution,
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
