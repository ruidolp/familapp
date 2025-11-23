/**
 * /api/metricas/listas/top-productos
 *
 * Obtiene los top 10 productos más comprados en un mes específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import { sql } from 'kysely'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Obtener listas del usuario
    const userLists = await db
      .selectFrom('shopping_lists')
      .select('id')
      .where('user_id', '=', session.user.id)
      .where('deleted_at', 'is', null)
      .execute()

    const listIds = userLists.map((list) => list.id)

    if (listIds.length === 0) {
      return NextResponse.json({ productos: [] })
    }

    // Obtener top 10 productos más comprados
    const topProductos = await db
      .selectFrom('shopping_execution_items as sei')
      .innerJoin('shopping_executions as se', 'se.id', 'sei.shopping_execution_id')
      .leftJoin('product_catalog as pc', (join) =>
        join.onRef('pc.id', '=', 'sei.product_id').on('sei.is_catalog', '=', true)
      )
      .leftJoin('product_user_custom as puc', 'puc.id', 'sei.product_custom_id')
      .select([
        sql<string>`COALESCE(pc.nombre, puc.nombre)`.as('nombre'),
        sql<number>`COUNT(*)::int`.as('total_compras'),
      ])
      .where('se.shopping_list_id', 'in', listIds)
      .where('se.deleted_at', 'is', null)
      .where('sei.es_comprado', '=', true)
      .where('se.completed_at', '>=', startDate)
      .where('se.completed_at', '<=', endDate)
      .groupBy(sql`COALESCE(pc.nombre, puc.nombre)`)
      .orderBy('total_compras', 'desc')
      .limit(10)
      .execute()

    return NextResponse.json({
      success: true,
      productos: topProductos,
    })
  } catch (error: any) {
    console.error('Error al obtener top productos:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
