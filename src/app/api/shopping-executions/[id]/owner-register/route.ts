import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import { getShoppingExecution } from '@/infrastructure/database/queries/shopping-lists.queries'
import { crearTransaccion } from '@/application/services/transacciones.service'
import { findBilleterasByUser } from '@/infrastructure/database/queries/billeteras.queries'
import { findUserConfig } from '@/infrastructure/database/queries/user-config.queries'

/**
 * POST /api/shopping-executions/[id]/owner-register
 *
 * Allow list owner to register or dismiss purchases made by invited users
 *
 * Body:
 * {
 *   action: 'register' | 'dismiss'
 *   sobre_id?: string (required if action is 'register')
 *   categoria_id?: string (required if action is 'register')
 *   subcategoria_id?: string (required if action is 'register')
 * }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: executionId } = await context.params
    const userId = session.user.id

    // Get execution
    const execution = await getShoppingExecution(executionId)
    if (!execution) {
      return NextResponse.json(
        { error: 'Ejecución no encontrada' },
        { status: 404 }
      )
    }

    // Get the shopping list to verify ownership
    const list = await db
      .selectFrom('shopping_lists')
      .select(['id', 'user_id'])
      .where('id', '=', execution.shopping_list_id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Verify user is the list owner
    if (list.user_id !== userId) {
      return NextResponse.json(
        { error: 'Solo el owner de la lista puede registrar compras' },
        { status: 403 }
      )
    }

    // Verify execution was made by someone else (invited user)
    if (execution.user_id === userId) {
      return NextResponse.json(
        { error: 'No puedes registrar tus propias compras' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { action, sobre_id, categoria_id, subcategoria_id } = body

    if (action === 'register') {
      // Validate required fields
      if (!sobre_id || !categoria_id || !subcategoria_id) {
        return NextResponse.json(
          { error: 'sobre_id, categoria_id y subcategoria_id son requeridos' },
          { status: 400 }
        )
      }

      // Get owner's user config for currency
      const userConfig = await findUserConfig(userId)
      if (!userConfig) {
        return NextResponse.json(
          { error: 'Configuración de usuario no encontrada' },
          { status: 400 }
        )
      }

      // Get owner's primary wallet (first wallet)
      const billeteras = await findBilleterasByUser(userId)
      if (!billeteras || billeteras.length === 0) {
        return NextResponse.json(
          { error: 'No tienes billeteras configuradas' },
          { status: 400 }
        )
      }
      const billeteraPrincipal = billeteras[0]

      // Calculate total amount from execution
      const totalMonto = Number(execution.total_manual || execution.total_calculated || 0)

      if (totalMonto <= 0) {
        return NextResponse.json(
          { error: 'El monto de la compra debe ser mayor a cero' },
          { status: 400 }
        )
      }

      // Create transaction (gasto) for owner's budget
      const transaccionResult = await crearTransaccion({
        monto: totalMonto,
        monedaId: userConfig.moneda_principal_id,
        billeteraId: billeteraPrincipal.id,
        tipo: 'GASTO',
        descripcion: `Compra de lista compartida - ${execution.store_name || 'Sin tienda'}`,
        fecha: execution.completed_at ? new Date(execution.completed_at) : new Date(),
        sobreId: sobre_id,
        categoriaId: categoria_id,
        subcategoriaId: subcategoria_id,
        userId: userId,
        origen: 'SHOPPING_LIST',
      })

      if (!transaccionResult.success) {
        return NextResponse.json(
          { error: transaccionResult.error || 'Error al crear transacción' },
          { status: 400 }
        )
      }

      // Update execution with owner's registration
      await db
        .updateTable('shopping_executions')
        .set({
          owner_registration_status: 'registered',
          owner_sobre_id: sobre_id,
          owner_categoria_id: categoria_id,
          owner_subcategoria_id: subcategoria_id,
          updated_at: new Date(),
        })
        .where('id', '=', executionId)
        .execute()

      return NextResponse.json({
        success: true,
        message: 'Compra registrada en tus sobres',
        transaccion: transaccionResult.data,
      })

    } else if (action === 'dismiss') {
      // Mark as dismissed
      await db
        .updateTable('shopping_executions')
        .set({
          owner_registration_status: 'dismissed',
          updated_at: new Date(),
        })
        .where('id', '=', executionId)
        .execute()

      return NextResponse.json({
        success: true,
        message: 'Compra descartada',
      })

    } else {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser "register" o "dismiss"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ POST /api/shopping-executions/[id]/owner-register error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}
