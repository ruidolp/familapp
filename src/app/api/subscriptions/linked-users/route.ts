/**
 * GET /api/subscriptions/linked-users
 *
 * Obtener lista de usuarios vinculados al plan del usuario autenticado.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { getUserLinkedUsers } from '@/application/services/subscriptions'

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar que el usuario no está vinculado (solo owners pueden ver sus vinculados)
    if (session.user.subscription.isLinked) {
      return NextResponse.json(
        { error: 'You cannot view linked users while linked to another plan' },
        { status: 403 }
      )
    }

    // Obtener usuarios vinculados
    const linkedUsers = await getUserLinkedUsers(session.user.id)

    return NextResponse.json({
      linkedUsers,
      count: linkedUsers.length,
    })
  } catch (error) {
    console.error('Error getting linked users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
