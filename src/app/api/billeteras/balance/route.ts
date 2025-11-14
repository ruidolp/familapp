/**
 * GET /api/billeteras/balance
 *
 * Obtener balance consolidado de todas las billeteras del usuario
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { obtenerBalanceConsolidado } from '@/application/services/billeteras.service'

/**
 * GET /api/billeteras/balance
 *
 * Devuelve el balance total agrupado por moneda
 *
 * Response:
 * {
 *   success: true,
 *   balance: {
 *     total_billeteras: number,
 *     balance_por_moneda: [
 *       {
 *         moneda_id: string,
 *         saldo_real_total: number,
 *         saldo_proyectado_total: number,
 *         billeteras: number
 *       }
 *     ]
 *   }
 * }
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await obtenerBalanceConsolidado(session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      balance: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener balance consolidado:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
