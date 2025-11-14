/**
 * /api/transacciones
 *
 * API endpoints para gestión de transacciones
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  crearTransaccion,
  obtenerTransacciones,
} from '@/application/services/transacciones.service'

/**
 * GET /api/transacciones
 *
 * Obtener transacciones del usuario con filtros opcionales
 *
 * Query params:
 *   - tipo?: TipoTransaccion
 *   - billeteraId?: string
 *   - sobreId?: string
 *   - categoriaId?: string
 *   - fechaInicio?: string (ISO date)
 *   - fechaFin?: string (ISO date)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') as any
    const billeteraId = searchParams.get('billeteraId') || undefined
    const sobreId = searchParams.get('sobreId') || undefined
    const categoriaId = searchParams.get('categoriaId') || undefined
    const fechaInicioStr = searchParams.get('fechaInicio')
    const fechaFinStr = searchParams.get('fechaFin')

    const filters = {
      tipo,
      billeteraId,
      sobreId,
      categoriaId,
      fechaInicio: fechaInicioStr ? new Date(fechaInicioStr) : undefined,
      fechaFin: fechaFinStr ? new Date(fechaFinStr) : undefined,
    }

    const result = await obtenerTransacciones(session.user.id, filters)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transacciones: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener transacciones:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transacciones
 *
 * Crear una nueva transacción
 *
 * Body:
 * {
 *   monto: number (requerido)
 *   monedaId: string (requerido)
 *   billeteraId: string (requerido)
 *   tipo: TipoTransaccion (requerido) - GASTO | INGRESO | TRANSFERENCIA | DEPOSITO | PAGO_TC | AJUSTE
 *   descripcion?: string
 *   fecha: string (ISO date, requerido)
 *   sobreId?: string (para gastos en sobre)
 *   categoriaId?: string
 *   subcategoriaId?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   transaccion: {...},
 *   warning?: {
 *     type: 'OVERSPEND_SOBRE' | 'NEGATIVE_WALLET'
 *     message: string
 *     details: {
 *       presupuesto_asignado: number
 *       gastado: number
 *       sobreNombre: string
 *       porcentajeExceso: number
 *     }
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      monto,
      monedaId,
      billeteraId,
      tipo,
      descripcion,
      fecha,
      sobreId,
      categoriaId,
      subcategoriaId,
    } = body

    // Validaciones
    if (!monto || !monedaId || !billeteraId || !tipo || !fecha) {
      return NextResponse.json(
        { error: 'Campos requeridos: monto, monedaId, billeteraId, tipo, fecha' },
        { status: 400 }
      )
    }

    const result = await crearTransaccion({
      monto: Number(monto),
      monedaId,
      billeteraId,
      tipo,
      descripcion,
      fecha: new Date(fecha),
      sobreId,
      categoriaId,
      subcategoriaId,
      userId: session.user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Calcular warnings si hay
    const warnings = (result.data as any)?.warnings

    return NextResponse.json(
      {
        success: true,
        transaccion: result.data,
        ...(warnings && { warning: warnings }),
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al crear transacción:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
