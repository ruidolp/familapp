/**
 * /api/metricas/listas/top-tiendas
 *
 * Obtiene el total de compras por tienda en un mes específico
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
      return NextResponse.json({ tiendas: [] })
    }

    // Obtener total de compras por tienda
    const topTiendas = await db
      .selectFrom('shopping_executions as se')
      .select([
        'se.store_name as tienda',
        sql<number>`SUM(COALESCE(se.total_manual, se.total_calculated, se.total_estimado, 0))::numeric`.as('total'),
      ])
      .where('se.shopping_list_id', 'in', listIds)
      .where('se.deleted_at', 'is', null)
      .where('se.store_name', 'is not', null)
      .where('se.completed_at', '>=', startDate)
      .where('se.completed_at', '<=', endDate)
      .groupBy('se.store_name')
      .orderBy('total', 'desc')
      .execute()

    return NextResponse.json({
      success: true,
      tiendas: topTiendas.map((t) => ({
        tienda: t.tienda,
        total: Number(t.total),
      })),
    })
  } catch (error: any) {
    console.error('Error al obtener top tiendas:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
