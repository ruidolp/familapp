/**
 * /api/sobres/[id]/asignaciones
 *
 * Endpoints para gestión de asignaciones de presupuesto desde billeteras a sobres
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findSobreById,
  findParticipanteInSobre,
  findAsignacionesBySobre,
  createAsignacion,
  updateParticipanteTracking,
  updateSobrePresupuesto,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  findBilleteraById,
  createBilleteraTransaccion,
  updateBilleteraSaldoProyectado,
} from '@/infrastructure/database/queries/billeteras.queries'

/**
 * GET /api/sobres/[id]/asignaciones
 *
 * Obtener todas las asignaciones de presupuesto del sobre
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId } = await context.params

    // Verificar que el sobre existe y el usuario tiene acceso
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return NextResponse.json({ error: 'Sobre no encontrado' }, { status: 404 })
    }

    const participante = await findParticipanteInSobre(sobreId, session.user.id)
    if (!participante) {
      return NextResponse.json(
        { error: 'No tienes acceso a este sobre' },
        { status: 403 }
      )
    }

    // Obtener asignaciones
    const asignaciones = await findAsignacionesBySobre(sobreId)

    return NextResponse.json({
      success: true,
      asignaciones,
      sobre: {
        id: sobre.id,
        nombre: sobre.nombre,
        presupuesto_asignado: sobre.presupuesto_asignado,
        gastado: sobre.gastado,
        libre: sobre.presupuesto_asignado - (sobre.gastado || 0),
      },
    })
  } catch (error: any) {
    console.error('Error al obtener asignaciones:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sobres/[id]/asignaciones
 *
 * Agregar presupuesto desde billetera a sobre
 *
 * Body:
 * {
 *   billeteraId: string (requerido)
 *   monto: number (requerido)
 *   descripcion?: string
 * }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId } = await context.params
    const { billeteraId, monto, descripcion } = await req.json()

    // Validaciones
    if (!billeteraId || !monto) {
      return NextResponse.json(
        { error: 'Campos requeridos: billeteraId, monto' },
        { status: 400 }
      )
    }

    if (monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      )
    }

    // Verificar que el sobre existe y el usuario tiene acceso
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return NextResponse.json({ error: 'Sobre no encontrado' }, { status: 404 })
    }

    const participante = await findParticipanteInSobre(sobreId, session.user.id)
    if (!participante) {
      return NextResponse.json(
        { error: 'No tienes acceso a este sobre' },
        { status: 403 }
      )
    }

    // Verificar que la billetera pertenece al usuario
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

    // DEBUG: Log inicial
    console.log('[ASIGNACION DEBUG] Iniciando asignación de presupuesto:', {
      sobreId,
      billeteraId,
      monto,
      sobreActual: {
        id: sobre.id,
        presupuesto_asignado: sobre.presupuesto_asignado,
        nombre: sobre.nombre,
      },
      billeteraActual: {
        id: billetera.id,
        saldo_real: billetera.saldo_real,
        saldo_proyectado: billetera.saldo_proyectado,
        nombre: billetera.nombre,
      },
    })

    // Crear asignación
    const asignacion = await createAsignacion(
      sobreId,
      billeteraId,
      session.user.id,
      monto,
      billetera.moneda_principal_id,
      'INICIAL'
    )

    // Actualizar tracking del participante en el sobre
    const nuevoPresupuesto = Number(participante.presupuesto_asignado) + monto
    await updateParticipanteTracking(sobreId, session.user.id, nuevoPresupuesto)

    // **CRÍTICO**: Actualizar presupuesto_asignado del sobre
    // FIX: Convertir Decimal string a Number antes de suma
    const nuevoPresupuestoSobre = Number(sobre.presupuesto_asignado) + monto
    const sobreActualizado = await updateSobrePresupuesto(sobreId, nuevoPresupuestoSobre)
    console.log('[ASIGNACION DEBUG] Sobre actualizado:', {
      id: sobreActualizado?.id,
      presupuesto_asignado: sobreActualizado?.presupuesto_asignado,
    })

    // **CRÍTICO**: Obtener todas las asignaciones actuales del sobre para calcular saldo_proyectado
    const asignacionesActuales = await findAsignacionesBySobre(sobreId)

    // Sumar todas las asignaciones de ESTA billetera
    const totalAsignacionesBilletera = asignacionesActuales
      .filter((a: any) => a.billetera_id === billeteraId)
      .reduce((sum: number, a: any) => sum + Number(a.monto_asignado || 0), 0)

    // Calcular nuevo saldo_proyectado: saldo_real - total asignaciones
    // FIX: Convertir Decimal string a Number antes de resta
    const nuevoSaldoProyectado = Number(billetera.saldo_real) - totalAsignacionesBilletera
    const billeteraActualizada = await updateBilleteraSaldoProyectado(billeteraId, nuevoSaldoProyectado)
    console.log('[ASIGNACION DEBUG] Billetera actualizada:', {
      id: billeteraActualizada?.id,
      saldo_real: billeteraActualizada?.saldo_real,
      saldo_proyectado: billeteraActualizada?.saldo_proyectado,
      totalAsignacionesBilletera,
    })

    // Registrar en billeteras_transacciones (solo registra, no debita)
    await createBilleteraTransaccion(
      billeteraId,
      session.user.id,
      'ASIGNACION_SOBRE',
      monto,
      billetera.moneda_principal_id,
      billetera.saldo_real, // No cambia, solo se reserva
      null,
      null,
      `Asignado a sobre: ${sobre.nombre}`
    )

    console.log('[ASIGNACION DEBUG] Asignación completada exitosamente')

    return NextResponse.json(
      {
        success: true,
        asignacion,
        message: `Se asignaron $${monto} a ${sobre.nombre}`,
        debug: {
          presupuesto_asignado_sobre: nuevoPresupuestoSobre,
          saldo_proyectado_billetera: nuevoSaldoProyectado,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al crear asignación:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
