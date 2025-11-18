import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { createShoppingExecution } from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * POST /api/shopping-executions
 * Create a new shopping execution (from sync)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      shopping_list_id,
      status,
      store_name,
      sobre_id,
      categoria_sobre_id,
      subcategoria_id,
      total_calculated,
      total_manual,
      tiempo_transcurrido,
      started_at,
      completed_at,
    } = body

    if (!shopping_list_id) {
      return NextResponse.json(
        { error: 'shopping_list_id es requerido' },
        { status: 400 }
      )
    }

    // Create execution
    const execution = await createShoppingExecution({
      shopping_list_id,
      user_id: session.user.id,
      status: status || 'IN_PROGRESS',
      store_name,
      sobre_id,
      categoria_sobre_id,
      total_estimado: total_manual,
      total_calculated,
      total_manual,
      tiempo_transcurrido,
      started_at: started_at ? new Date(started_at) : new Date(),
      completed_at: completed_at ? new Date(completed_at) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        execution,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ POST /api/shopping-executions error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear ejecución' },
      { status: 500 }
    )
  }
}
