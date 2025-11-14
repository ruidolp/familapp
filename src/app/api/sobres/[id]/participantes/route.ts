/**
 * /api/sobres/[id]/participantes
 *
 * API endpoints para gestión de participantes de sobres
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  obtenerParticipantes,
  agregarParticipante,
} from '@/application/services/sobres.service'

/**
 * GET /api/sobres/[id]/participantes
 *
 * Obtener todos los participantes de un sobre
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

    const { id } = await context.params

    const result = await obtenerParticipantes(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      participantes: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener participantes:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sobres/[id]/participantes
 *
 * Agregar un participante a un sobre
 *
 * Body:
 * {
 *   participanteId: string (requerido) - ID del usuario a agregar
 *   rol: RolSobreUsuario (requerido) - ADMIN | CONTRIBUTOR | VIEWER
 *   presupuestoAsignado?: number
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

    const { id } = await context.params
    const body = await req.json()
    const { participanteId, rol, presupuestoAsignado } = body

    // Validaciones
    if (!participanteId || !rol) {
      return NextResponse.json(
        { error: 'Campos requeridos: participanteId, rol' },
        { status: 400 }
      )
    }

    const result = await agregarParticipante({
      sobreId: id,
      userId: session.user.id,
      participanteId,
      rol,
      presupuestoAsignado,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Participante agregado correctamente',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al agregar participante:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
