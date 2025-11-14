/**
 * GET /api/subscriptions/status
 *
 * Obtener estado completo de suscripción del usuario autenticado.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { getSubscriptionStatus } from '@/application/services/subscriptions'

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

    // Obtener estado de suscripción
    const status = await getSubscriptionStatus(session.user.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
