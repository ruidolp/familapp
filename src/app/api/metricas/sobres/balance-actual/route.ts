/**
 * /api/metricas/sobres/balance-actual
 *
 * Obtiene el balance actual de todos los sobres del usuario (solo mes actual)
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
    const sobreId = searchParams.get('sobreId')

    // Obtener balance total de todos los sobres activos (o uno en particular)
    let balanceQuery = db
      .selectFrom('sobres as s')
      .select([
        sql<number>`SUM(s.presupuesto_asignado)::numeric`.as('total_disponible'),
        sql<number>`SUM(s.gastado)::numeric`.as('total_gastado'),
      ])
      .where('s.usuario_id', '=', session.user.id)
      .where('s.deleted_at', 'is', null)

    if (sobreId) {
      balanceQuery = balanceQuery.where('s.id', '=', sobreId)
    }

    const balance = await balanceQuery.executeTakeFirst()

    const totalDisponible = Number(balance?.total_disponible || 0)
    const totalGastado = Number(balance?.total_gastado || 0)

    return NextResponse.json({
      success: true,
      balance: {
        total_disponible: totalDisponible - totalGastado,
        total_gastado: totalGastado,
      },
    })
  } catch (error: any) {
    console.error('Error al obtener balance actual:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
