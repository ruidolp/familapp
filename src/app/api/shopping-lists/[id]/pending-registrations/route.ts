import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import { getShoppingListById } from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * GET /api/shopping-lists/[id]/pending-registrations
 *
 * Get executions from invited users that need owner registration decision
 * Returns executions where:
 * - User is not the executor (invited user executed)
 * - No sobre was selected OR sobre is not shared with owner
 * - owner_registration_status is null or 'pending'
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listId } = await context.params
    const userId = session.user.id

    // Verify user is the list owner
    const list = await getShoppingListById(listId)
    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    if (list.user_id !== userId) {
      return NextResponse.json(
        { error: 'Solo el owner puede ver registros pendientes' },
        { status: 403 }
      )
    }

    // Get all completed executions from the list
    const executions = await db
      .selectFrom('shopping_executions as se')
      .leftJoin('users as u', 'se.user_id', 'u.id')
      .selectAll('se')
      .select([
        'u.name as executor_name',
        'u.email as executor_email',
      ])
      .where('se.shopping_list_id', '=', listId)
      .where('se.status', '=', 'COMPLETED')
      .where('se.user_id', '!=', userId) // Only from invited users
      .where('se.deleted_at', 'is', null)
      .orderBy('se.completed_at', 'desc')
      .execute()

    // Filter executions that need owner registration
    const pendingExecutions = []

    for (const execution of executions) {
      // Skip if owner already made a decision
      if (execution.owner_registration_status === 'registered' ||
          execution.owner_registration_status === 'dismissed') {
        continue
      }

      // Case 1: No sobre selected - needs registration
      if (!execution.sobre_id) {
        pendingExecutions.push(execution)
        continue
      }

      // Case 2: Sobre selected - check if it's shared with owner
      const sobreCollaborator = await db
        .selectFrom('sobres_usuarios')
        .select('id')
        .where('sobre_id', '=', execution.sobre_id)
        .where('usuario_id', '=', userId)
        .executeTakeFirst()

      const sobreOwner = await db
        .selectFrom('sobres')
        .select('usuario_id')
        .where('id', '=', execution.sobre_id)
        .executeTakeFirst()

      const isSobreSharedWithOwner = !!sobreCollaborator || sobreOwner?.usuario_id === userId

      // If sobre is NOT shared with owner, needs registration
      if (!isSobreSharedWithOwner) {
        pendingExecutions.push(execution)
      }
    }

    // Mark as pending if not already marked
    if (pendingExecutions.length > 0) {
      const idsToUpdate = pendingExecutions
        .filter(e => !e.owner_registration_status)
        .map(e => e.id)

      if (idsToUpdate.length > 0) {
        await db
          .updateTable('shopping_executions')
          .set({ owner_registration_status: 'pending' })
          .where('id', 'in', idsToUpdate)
          .execute()
      }
    }

    return NextResponse.json({
      success: true,
      pendingExecutions,
      count: pendingExecutions.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/pending-registrations error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener registros pendientes' },
      { status: 500 }
    )
  }
}
