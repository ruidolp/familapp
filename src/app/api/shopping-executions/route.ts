import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { createShoppingExecution, getActiveExecutionsByUser, getCompletedExecutionsByUser } from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * GET /api/shopping-executions
 * Get shopping executions for the current user
 * ?status=IN_PROGRESS|COMPLETED (defaults to IN_PROGRESS)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'IN_PROGRESS'

    let executions
    if (status === 'COMPLETED') {
      executions = await getCompletedExecutionsByUser(session.user.id)
    } else {
      executions = await getActiveExecutionsByUser(session.user.id)
    }

    return NextResponse.json({
      success: true,
      executions,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-executions error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ejecuciones' },
      { status: 500 }
    )
  }
}

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
      store_name: store_name || null,
      sobre_id: sobre_id || null,
      categoria_sobre_id: categoria_sobre_id || null,
      total_estimado: total_manual || null,
      total_calculated: total_calculated || null,
      total_manual: total_manual || null,
      tiempo_transcurrido: tiempo_transcurrido || null,
      started_at: started_at ? new Date(started_at) : new Date(),
      completed_at: completed_at ? new Date(completed_at) : null,
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
