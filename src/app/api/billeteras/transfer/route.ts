/**
 * POST /api/billeteras/transfer
 *
 * Transferir dinero entre billeteras del mismo usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { transferirEntreBilleteras } from '@/application/services/billeteras.service'

/**
 * POST /api/billeteras/transfer
 *
 * Body:
 * {
 *   billeteraOrigenId: string (requerido, o "UNDECLARED" para ajuste manual)
 *   billeteraDestinoId: string (requerido, o "UNDECLARED" para ajuste manual)
 *   monto: number (requerido)
 *   descripcion?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { billeteraOrigenId, billeteraDestinoId, monto, descripcion } = body

    // Validaciones
    if (!billeteraOrigenId || !billeteraDestinoId || monto === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: billeteraOrigenId, billeteraDestinoId, monto' },
        { status: 400 }
      )
    }

    if (typeof monto !== 'number' || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número mayor a cero' },
        { status: 400 }
      )
    }

    const result = await transferirEntreBilleteras({
      billeteraOrigenId,
      billeteraDestinoId,
      monto,
      descripcion,
      userId: session.user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.data?.message || 'Ajuste registrado correctamente',
    })
  } catch (error: any) {
    console.error('Error al realizar transferencia:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
