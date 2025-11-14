/**
 * GET /api/billeteras/[id]/sobres-vinculados
 *
 * Verificar si billetera tiene sobres vinculados (para validación de eliminación)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verificar que billetera existe y pertenece al usuario
    const billetera = await db
      .selectFrom('billeteras')
      .selectAll()
      .where('id', '=', id)
      .where('usuario_id', '=', session.user.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!billetera) {
      return NextResponse.json(
        { error: 'Billetera no encontrada' },
        { status: 404 }
      )
    }

    // Buscar sobres que usan esta billetera
    const sobresVinculados = await db
      .selectFrom('sobres')
      .select(['id', 'nombre', 'presupuesto_asignado'])
      .where('moneda_principal_id', '=', billetera.moneda_principal_id)
      .where('usuario_id', '=', session.user.id)
      .where('deleted_at', 'is', null)
      .execute()

    // Calcular impacto (cuánto presupuesto total se vería afectado)
    const totalPresupuestoAfectado = sobresVinculados.reduce(
      (sum, sobre) => sum + sobre.presupuesto_asignado,
      0
    )

    return NextResponse.json({
      success: true,
      hasLinkedEnvelopes: sobresVinculados.length > 0,
      linkedEnvelopes: sobresVinculados,
      count: sobresVinculados.length,
      totalPresupuestoAfectado,
    })
  } catch (error: any) {
    console.error('Error al verificar sobres vinculados:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
