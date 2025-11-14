/**
 * POST /api/subscriptions/cancel
 *
 * Cancelar suscripción activa del usuario.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { cancelSubscription } from '@/application/services/subscriptions'

export async function POST() {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar que el usuario no está vinculado (solo owners pueden cancelar)
    if (session.user.subscription.isLinked) {
      return NextResponse.json(
        { error: 'Cannot cancel: you are linked to another user\'s plan. Ask the owner to unlink you.' },
        { status: 403 }
      )
    }

    // Cancelar suscripción
    const result = await cancelSubscription(session.user.id)

    // TODO: En producción, también cancelar en Stripe/Apple/Google

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: result,
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)

    if (error.message === 'No active subscription found') {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
