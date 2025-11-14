/**
 * /api/sobres/[id]/devolver
 *
 * Endpoint para devolver presupuesto de un sobre a billeteras
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findSobreById,
  findParticipanteInSobre,
  findAsignacionesByUsuarioInSobre,
  getPresupuestoLibreUsuarioInSobre,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  findBilleteraById,
  createBilleteraTransaccion,
  updateBilleteraSaldos,
} from '@/infrastructure/database/queries/billeteras.queries'
import { findTransaccionesBySobre } from '@/infrastructure/database/queries/transacciones.queries'

/**
 * POST /api/sobres/[id]/devolver
 *
 * Devolver presupuesto de un sobre a la(s) billetera(s)
 *
 * Body:
 * {
 *   billeteraDestinoId?: string (opcional, si no se proporciona devuelve a todas proportionalmente)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   devolucion: {
 *     sobreId: string,
 *     presupuestoDevuelto: number,
 *     asignacionesAfectadas: number,
 *     billeteras: [
 *       {
 *         billeteraId: string,
 *         montoDevuelto: number,
 *         saldoAnterior: number,
 *         saldoNuevo: number
 *       }
 *     ]
 *   },
 *   message: string
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
    const { billeteraDestinoId } = await req.json()

    // Verificar que el sobre existe
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return NextResponse.json({ error: 'Sobre no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario tiene acceso al sobre
    const participante = await findParticipanteInSobre(sobreId, session.user.id)
    if (!participante) {
      return NextResponse.json(
        { error: 'No tienes acceso a este sobre' },
        { status: 403 }
      )
    }

    // Obtener asignaciones del usuario en el sobre
    const asignaciones = await findAsignacionesByUsuarioInSobre(sobreId, session.user.id)
    if (!asignaciones || asignaciones.length === 0) {
      return NextResponse.json(
        { error: 'No tienes asignaciones en este sobre' },
        { status: 400 }
      )
    }

    // Calcular presupuesto libre (presupuesto_asignado - gastado)
    const gastosBySobre = await findTransaccionesBySobre(sobreId)
    const gastosUsuario = gastosBySobre
      .filter((t: any) => t.usuario_id === session.user.id && t.tipo === 'GASTO')
      .reduce((sum: number, t: any) => sum + Number(t.monto || 0), 0)

    const presupuestoAsignado = asignaciones.reduce(
      (sum: number, a: any) => sum + Number(a.monto_asignado || 0),
      0
    )

    const presupuestoLibre = presupuestoAsignado - gastosUsuario

    if (presupuestoLibre <= 0) {
      return NextResponse.json(
        { error: 'No hay presupuesto disponible para devolver' },
        { status: 400 }
      )
    }

    // Procesar devoluciones
    const devoluciones: any[] = []
    let totalDevuelto = 0

    if (billeteraDestinoId) {
      // Devolver a una billetera específica
      const billetera = await findBilleteraById(billeteraDestinoId)
      if (!billetera) {
        return NextResponse.json(
          { error: 'Billetera destino no encontrada' },
          { status: 404 }
        )
      }

      if (billetera.usuario_id !== session.user.id) {
        return NextResponse.json(
          { error: 'No tienes permiso para usar esta billetera' },
          { status: 403 }
        )
      }

      const saldoAnterior = Number(billetera.saldo_real)
      const saldoNuevo = saldoAnterior + presupuestoLibre

      // Actualizar saldo
      await updateBilleteraSaldos(billeteraDestinoId, saldoNuevo, saldoNuevo)

      // Registrar transacción
      await createBilleteraTransaccion(
        billeteraDestinoId,
        session.user.id,
        'DEVOLUCION_SOBRE',
        presupuestoLibre,
        billetera.moneda_principal_id,
        saldoNuevo,
        null,
        null,
        `Devolución de ${sobre.nombre}`
      )

      devoluciones.push({
        billeteraId: billeteraDestinoId,
        montoDevuelto: presupuestoLibre,
        saldoAnterior,
        saldoNuevo,
      })

      totalDevuelto = presupuestoLibre
    } else {
      // Devolver a todas las billeteras proportionalmente
      for (const asignacion of asignaciones) {
        const billetera = await findBilleteraById(asignacion.billetera_id)
        if (!billetera) continue

        // Proporcional según el monto asignado
        const proporcion = Number(asignacion.monto_asignado) / presupuestoAsignado
        const montoDevolver = presupuestoLibre * proporcion

        if (montoDevolver > 0) {
          const saldoAnterior = Number(billetera.saldo_real)
          const saldoNuevo = saldoAnterior + montoDevolver

          // Actualizar saldo
          await updateBilleteraSaldos(
            asignacion.billetera_id,
            saldoNuevo,
            saldoNuevo
          )

          // Registrar transacción
          await createBilleteraTransaccion(
            asignacion.billetera_id,
            session.user.id,
            'DEVOLUCION_SOBRE',
            montoDevolver,
            billetera.moneda_principal_id,
            saldoNuevo,
            null,
            null,
            `Devolución de ${sobre.nombre}`
          )

          devoluciones.push({
            billeteraId: asignacion.billetera_id,
            montoDevuelto: montoDevolver,
            saldoAnterior,
            saldoNuevo,
          })

          totalDevuelto += montoDevolver
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        devolucion: {
          sobreId,
          presupuestoDevuelto: totalDevuelto,
          asignacionesAfectadas: devoluciones.length,
          billeteras: devoluciones,
        },
        message: `Se devolvieron $${totalDevuelto.toFixed(2)} de ${sobre.nombre}`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al devolver presupuesto:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
