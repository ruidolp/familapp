import { NextRequest, NextResponse } from 'next/server'
import { findInvitacionByCodigo } from '@/infrastructure/database/queries/sobres.queries'

/**
 * GET /api/sobres/invitations/code/[code]
 * Obtener información de una invitación por código único
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params

    if (!code) {
      return NextResponse.json(
        { error: 'Código de invitación requerido' },
        { status: 400 }
      )
    }

    const invitacion = await findInvitacionByCodigo(code)

    if (!invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada o expirada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitacion,
    })
  } catch (error: any) {
    console.error('❌ GET /api/sobres/invitations/code/[code] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener invitación' },
      { status: 500 }
    )
  }
}
