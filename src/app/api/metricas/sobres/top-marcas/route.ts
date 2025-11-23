/**
 * /api/metricas/sobres/top-marcas
 *
 * Obtiene las top marcas (subcategorías) con más gastos en un mes específico
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

    // Obtener top marcas (subcategorías) con más gastos
    const topMarcas = await db
      .selectFrom('transacciones as t')
      .innerJoin('billeteras as b', 'b.id', 't.billetera_id')
      .innerJoin('subcategorias as sc', 'sc.id', 't.subcategoria_id')
      .select([
        'sc.nombre as marca',
        sql<number>`SUM(ABS(t.monto))::numeric`.as('total'),
      ])
      .where('b.usuario_id', '=', session.user.id)
      .where('t.sobre_id', 'is not', null)
      .where('t.subcategoria_id', 'is not', null)
      .where('t.tipo', '=', 'GASTO')
      .where('t.deleted_at', 'is', null)
      .where('t.fecha', '>=', startDate)
      .where('t.fecha', '<=', endDate)
      .groupBy('sc.nombre')
      .orderBy('total', 'desc')
      .limit(10)
      .execute()

    return NextResponse.json({
      success: true,
      marcas: topMarcas.map((m) => ({
        marca: m.marca,
        total: Number(m.total),
      })),
    })
  } catch (error: any) {
    console.error('Error al obtener top marcas:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
