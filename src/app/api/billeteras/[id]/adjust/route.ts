/**
 * POST /api/billeteras/[id]/adjust
 *
 * Ajustar saldo de billetera (crea transacción de ajuste)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { monto, descripcion } = body

    // Validar monto
    if (typeof monto !== 'number' || monto === 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      )
    }

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

    // Calcular nuevos saldos
    const nuevoSaldoReal = Number(billetera.saldo_real) + monto
    const nuevoSaldoProyectado = Number(billetera.saldo_proyectado) + monto

    // Actualizar saldos de billetera
    await db
      .updateTable('billeteras')
      .set({
        saldo_real: nuevoSaldoReal,
        saldo_proyectado: nuevoSaldoProyectado,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute()

    // Crear transacción de ajuste para auditoría
    await db
      .insertInto('transacciones')
      .values({
        usuario_id: session.user.id,
        billetera_id: id,
        moneda_id: billetera.moneda_principal_id,
        tipo: monto > 0 ? 'INGRESO' : 'GASTO',
        monto: Math.abs(monto),
        descripcion: descripcion || `Ajuste de saldo: ${monto > 0 ? '+' : ''}${monto}`,
        fecha: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute()

    // Obtener billetera actualizada
    const billeteraActualizada = await db
      .selectFrom('billeteras')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow()

    return NextResponse.json({
      success: true,
      billetera: billeteraActualizada,
    })
  } catch (error: any) {
    console.error('Error al ajustar saldo:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
