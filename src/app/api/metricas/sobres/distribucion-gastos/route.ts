/**
 * /api/metricas/sobres/distribucion-gastos
 *
 * Obtiene la distribución de gastos por categoría en un mes específico
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
    const sobreId = searchParams.get('sobreId')

    // Obtener distribución de gastos por categoría
    const categoriaExpr = sql<string>`COALESCE(c.nombre, 'Sin categoría')`

    let distribucionQuery = db
      .selectFrom('transacciones as t')
      .innerJoin('billeteras as b', 'b.id', 't.billetera_id')
      .leftJoin('categorias as c', 'c.id', 't.categoria_id')
      .select([
        categoriaExpr.as('categoria'),
        sql<number>`SUM(ABS(t.monto))::numeric`.as('total'),
      ])
      .where('b.usuario_id', '=', session.user.id)
      .where('t.sobre_id', 'is not', null)
      .where('t.tipo', '=', 'GASTO')
      .where('t.deleted_at', 'is', null)
      .where('t.fecha', '>=', startDate)
      .where('t.fecha', '<=', endDate)

    if (sobreId) {
      distribucionQuery = distribucionQuery.where('t.sobre_id', '=', sobreId)
    }

    const distribucion = await distribucionQuery
      .groupBy(categoriaExpr)
      .orderBy('total', 'desc')
      .execute()

    return NextResponse.json({
      success: true,
      categorias: distribucion.map((d) => ({
        categoria: d.categoria,
        total: Number(d.total),
      })),
    })
  } catch (error: any) {
    console.error('Error al obtener distribución de gastos:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
