/**
 * POST /api/subscriptions/downgrade
 *
 * Downgrade suscripción a plan FREE.
 * Cancela suscripción activa y desvincula usuarios.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { downgradePlan } from '@/application/services/subscriptions'

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

    // Verificar que el usuario no está vinculado (solo owners pueden hacer downgrade)
    if (session.user.subscription.isLinked) {
      return NextResponse.json(
        {
          error: 'Cannot downgrade: you are linked to another user\'s plan. Ask the owner to unlink you first.',
        },
        { status: 403 }
      )
    }

    // Verificar que el usuario tiene un plan de pago
    if (session.user.subscription.planSlug === 'free') {
      return NextResponse.json(
        { error: 'You are already on the FREE plan' },
        { status: 400 }
      )
    }

    // Realizar downgrade
    const result = await downgradePlan(session.user.id)

    // TODO: En producción, también cancelar en Stripe/Apple/Google
    // - Stripe: stripe.subscriptions.cancel(subscriptionId)
    // - Apple: Notificar al usuario que cancele desde Ajustes
    // - Google: Notificar al usuario que cancele desde Play Store

    return NextResponse.json({
      success: true,
      message: 'Subscription downgraded to FREE successfully',
      subscription: result,
    })
  } catch (error: any) {
    console.error('Error downgrading subscription:', error)

    if (error.message === 'Plan FREE not found') {
      return NextResponse.json(
        { error: 'FREE plan not configured in the system' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
