/**
 * /api/sobres/transferencia
 *
 * Endpoint para transferir presupuesto entre sobres
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findSobreById,
  findParticipanteInSobre,
  findAsignacionesByUsuarioInSobre,
  createAsignacion,
} from '@/infrastructure/database/queries/sobres.queries'
import { findTransaccionesBySobre } from '@/infrastructure/database/queries/transacciones.queries'

/**
 * POST /api/sobres/transferencia
 *
 * Transferir presupuesto de un sobre a otro
 *
 * Body:
 * {
 *   sobreOrigenId: string (requerido)
 *   sobreDestinoId: string (requerido)
 *   billeteraId: string (requerido)
 *   monto: number (requerido)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   transferencia: {
 *     sobreOrigenId: string,
 *     sobreDestinoId: string,
 *     monto: number,
 *     presupuestoOrigenAntes: number,
 *     presupuestoOrigenDespues: number,
 *     presupuestoDestinoAntes: number,
 *     presupuestoDestinoDespues: number
 *   },
 *   message: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sobreOrigenId, sobreDestinoId, billeteraId, monto } = await req.json()

    // Validaciones
    if (!sobreOrigenId || !sobreDestinoId || !billeteraId || !monto) {
      return NextResponse.json(
        { error: 'Campos requeridos: sobreOrigenId, sobreDestinoId, billeteraId, monto' },
        { status: 400 }
      )
    }

    if (monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      )
    }

    if (sobreOrigenId === sobreDestinoId) {
      return NextResponse.json(
        { error: 'No puedes transferir a el mismo sobre' },
        { status: 400 }
      )
    }

    // Verificar que ambos sobres existen
    const sobreOrigen = await findSobreById(sobreOrigenId)
    if (!sobreOrigen) {
      return NextResponse.json({ error: 'Sobre origen no encontrado' }, { status: 404 })
    }

    const sobreDestino = await findSobreById(sobreDestinoId)
    if (!sobreDestino) {
      return NextResponse.json({ error: 'Sobre destino no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario tiene acceso a ambos sobres
    const participanteOrigen = await findParticipanteInSobre(sobreOrigenId, session.user.id)
    if (!participanteOrigen) {
      return NextResponse.json(
        { error: 'No tienes acceso al sobre origen' },
        { status: 403 }
      )
    }

    const participanteDestino = await findParticipanteInSobre(sobreDestinoId, session.user.id)
    if (!participanteDestino) {
      return NextResponse.json(
        { error: 'No tienes acceso al sobre destino' },
        { status: 403 }
      )
    }

    // Calcular presupuesto disponible en origen
    const asignacionesOrigen = await findAsignacionesByUsuarioInSobre(sobreOrigenId, session.user.id)
    const presupuestoOrigenAntes = asignacionesOrigen.reduce(
      (sum: number, a: any) => sum + Number(a.monto_asignado || 0),
      0
    )

    const gastosOrigen = await findTransaccionesBySobre(sobreOrigenId)
    const gastosUsuarioOrigen = gastosOrigen
      .filter((t: any) => t.usuario_id === session.user.id && t.tipo === 'GASTO')
      .reduce((sum: number, t: any) => sum + Number(t.monto || 0), 0)

    const presupuestoLibreOrigen = presupuestoOrigenAntes - gastosUsuarioOrigen

    if (monto > presupuestoLibreOrigen) {
      return NextResponse.json(
        {
          error: `Presupuesto insuficiente. Disponible: $${presupuestoLibreOrigen.toFixed(2)}, Solicitado: $${monto.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Calcular presupuesto actual en destino
    const asignacionesDestino = await findAsignacionesByUsuarioInSobre(sobreDestinoId, session.user.id)
    const presupuestoDestinoAntes = asignacionesDestino.reduce(
      (sum: number, a: any) => sum + Number(a.monto_asignado || 0),
      0
    )

    // Obtener billetera para validar que pertenece al usuario
    const { findBilleteraById } = await import('@/infrastructure/database/queries/billeteras.queries')
    const billetera = await findBilleteraById(billeteraId)
    if (!billetera) {
      return NextResponse.json({ error: 'Billetera no encontrada' }, { status: 404 })
    }

    if (billetera.usuario_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para usar esta billetera' },
        { status: 403 }
      )
    }

    // Crear transacciones de transferencia:
    // 1. DISMINUCION en origen
    await createAsignacion(
      sobreOrigenId,
      billeteraId,
      session.user.id,
      -monto, // Negativo indica disminución
      billetera.moneda_principal_id,
      'DISMINUCION'
    )

    // 2. AUMENTO en destino
    await createAsignacion(
      sobreDestinoId,
      billeteraId,
      session.user.id,
      monto, // Positivo indica aumento
      billetera.moneda_principal_id,
      'AUMENTO'
    )

    const presupuestoOrigenDespues = presupuestoOrigenAntes - monto
    const presupuestoDestinoDespues = presupuestoDestinoAntes + monto

    return NextResponse.json(
      {
        success: true,
        transferencia: {
          sobreOrigenId,
          sobreDestinoId,
          monto,
          presupuestoOrigenAntes,
          presupuestoOrigenDespues,
          presupuestoDestinoAntes,
          presupuestoDestinoDespues,
        },
        message: `Transferidos $${monto.toFixed(2)} de ${sobreOrigen.nombre} a ${sobreDestino.nombre}`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al transferir presupuesto:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
