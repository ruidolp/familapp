/**
 * POST /api/billeteras/[id]/deposito-retiro
 *
 * Registrar un depósito o retiro en una billetera
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { depositarORetirar } from '@/application/services/billeteras.service'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: billeteraId } = await context.params
    const body = await req.json()
    const { monto, tipo, descripcion } = body

    // Validaciones básicas
    if (!monto || !tipo) {
      return NextResponse.json(
        { error: 'Campos requeridos: monto, tipo' },
        { status: 400 }
      )
    }

    if (!['DEPOSITO', 'RETIRO'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo debe ser DEPOSITO o RETIRO' },
        { status: 400 }
      )
    }

    const result = await depositarORetirar({
      billeteraId,
      monto,
      tipo,
      descripcion: descripcion || '',
      userId: session.user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error al registrar operación:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
