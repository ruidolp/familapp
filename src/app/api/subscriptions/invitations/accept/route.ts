/**
 * POST /api/subscriptions/invitations/accept
 *
 * Aceptar código de invitación y vincular usuario.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { acceptInvitation, validateInvitationCode } from '@/application/services/subscriptions'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required field: code' },
        { status: 400 }
      )
    }

    // Aceptar invitación
    const result = await acceptInvitation(session.user.id, code)

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      link: result,
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)

    // Manejar errores específicos
    const errorMessages: Record<string, { message: string; status: number }> = {
      'Invalid, expired, or already used invitation code': {
        message: 'The invitation code is invalid, expired, or already used',
        status: 400,
      },
      'User is already linked to another plan': {
        message: 'You are already linked to another user\'s plan',
        status: 409,
      },
      'Circular linking is not allowed': {
        message: 'Cannot accept this invitation due to circular linking',
        status: 400,
      },
    }

    const errorInfo = errorMessages[error.message]

    if (errorInfo) {
      return NextResponse.json(
        { error: errorInfo.message },
        { status: errorInfo.status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
