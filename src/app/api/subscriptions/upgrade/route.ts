/**
 * POST /api/subscriptions/upgrade
 *
 * Iniciar proceso de upgrade de plan.
 * En modo sandbox, crea una sesión de checkout simulada.
 * En producción, crearía sesión de Stripe/Apple/Google.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { findPlanBySlug } from '@/infrastructure/database/queries'
import { SUBSCRIPTION_CONFIG } from '@/infrastructure/config/subscription.config'

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
    const { planSlug, period, platform = 'web', locale = 'en' } = body

    // Validar datos
    if (!planSlug || !period) {
      return NextResponse.json(
        { error: 'Missing required fields: planSlug, period' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be monthly or yearly' },
        { status: 400 }
      )
    }

    // Verificar que el plan existe
    const plan = await findPlanBySlug(planSlug)

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Si está en modo sandbox, retornar URL de sandbox
    if (SUBSCRIPTION_CONFIG.paymentMode === 'sandbox') {
      const checkoutUrl = `/api/payments/sandbox/checkout?plan=${planSlug}&period=${period}&userId=${session.user.id}&locale=${locale}`

      return NextResponse.json({
        checkoutUrl,
        mode: 'sandbox',
      })
    }

    // TODO: En producción, crear sesión de Stripe/Apple/Google
    // Por ahora retornamos error indicando que no está implementado
    return NextResponse.json(
      { error: 'Production payment integration not implemented yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error upgrading plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
