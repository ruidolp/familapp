import { NextRequest, NextResponse } from 'next/server'
import { findInvitacionListaByCodigo } from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params

    const invitacion = await findInvitacionListaByCodigo(code)

    if (!invitacion) {
      return NextResponse.json(
        {
          error: 'Invitación no encontrada o expirada',
          expired: true,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitacion,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/invitations/code/[code] error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener invitación' },
      { status: 500 }
    )
  }
}
