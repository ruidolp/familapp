/**
 * POST /api/webhooks/sandbox
 *
 * Webhook simulado para procesar eventos de pago en sandbox.
 * Simula el comportamiento de webhooks de Stripe/Apple/Google.
 */

import { NextRequest, NextResponse } from 'next/server'
import { upgradePlan } from '@/application/services/subscriptions'
import { SUBSCRIPTION_CONFIG } from '@/infrastructure/config/subscription.config'

export async function POST(req: NextRequest) {
  try {
    // En sandbox, no verificamos firma (en producción sí se verifica)
    if (SUBSCRIPTION_CONFIG.paymentMode !== 'sandbox') {
      return NextResponse.json(
        { error: 'Sandbox webhook only available in sandbox mode' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      eventType,
      userId,
      planSlug,
      period,
      platform = 'web',
      amount,
      currency = 'USD',
    } = body

    // Validar datos requeridos
    if (!eventType || !userId || !planSlug || !period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Procesar según tipo de evento
    switch (eventType) {
      case 'payment.succeeded':
        // Simular ID de suscripción de plataforma
        const platformSubscriptionId = `sandbox_${planSlug}_${Date.now()}`

        // Actualizar plan del usuario
        await upgradePlan(
          userId,
          planSlug,
          platform as any,
          period as any,
          platformSubscriptionId
        )

        return NextResponse.json({
          success: true,
          message: 'Payment succeeded, plan upgraded',
          subscriptionId: platformSubscriptionId,
        })

      case 'payment.failed':
        // En caso de fallo, solo logueamos (no cambiamos el plan)
        console.log('Sandbox payment failed:', { userId, planSlug, amount })

        return NextResponse.json({
          success: true,
          message: 'Payment failure processed',
        })

      case 'subscription.cancelled':
        // TODO: Implementar cancelación desde webhook
        return NextResponse.json({
          success: true,
          message: 'Subscription cancellation processed',
        })

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${eventType}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error processing sandbox webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
