/**
 * Apple App Store Webhook Handler
 *
 * Recibe notificaciones server-to-server de Apple cuando:
 * - Un usuario compra/renueva una subscription
 * - Falló un pago
 * - Una subscription expiró
 * - Se otorgó un reembolso
 *
 * Docs: https://developer.apple.com/documentation/appstoreservernotifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAppleWebhook } from '@/infrastructure/utils/webhook-verification'
import {
  findSubscriptionByPlatformId,
  updateSubscription,
  createSubscription,
  findPlanBySlug,
  logSubscriptionEvent,
  findPendingPurchase,
  completePendingPurchase,
} from '@/infrastructure/database/queries'
import { invalidateUserSession } from '@/infrastructure/lib/session-manager'

/**
 * Mapear product ID de Apple a plan slug en DB
 */
function mapAppleProductToPlan(productId: string): string {
  const mapping: Record<string, string> = {
    premium_monthly: 'premium',
    premium_yearly: 'premium',
    familiar_monthly: 'familiar',
    familiar_yearly: 'familiar',
  }

  return mapping[productId] || 'free'
}

/**
 * Determinar period de subscription
 */
function getPeriodFromProduct(productId: string): 'monthly' | 'yearly' {
  return productId.includes('yearly') ? 'yearly' : 'monthly'
}

/**
 * POST /api/webhooks/apple
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Verificar autenticidad del webhook
    const isValid = await verifyAppleWebhook(body)

    if (!isValid) {
      console.error('[Apple Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Extraer datos del webhook
    const { notificationType, subtype, data } = body

    if (!data) {
      console.error('[Apple Webhook] Missing data')
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const {
      originalTransactionId,
      productId,
      expiresDate,
      purchaseDate,
      gracePeriodExpiresDate,
    } = data

    console.log(`[Apple Webhook] ${notificationType} (${subtype || 'N/A'})`, {
      originalTransactionId,
      productId,
    })

    // 3. Buscar subscription existente
    let subscription = await findSubscriptionByPlatformId('apple', originalTransactionId)

    // 4. Procesar evento
    switch (notificationType) {
      case 'SUBSCRIBED':
        if (subtype === 'INITIAL_BUY') {
          // Primera compra
          const planSlug = mapAppleProductToPlan(productId)
          const plan = await findPlanBySlug(planSlug)

          if (!plan) {
            console.error(`[Apple Webhook] Plan not found: ${planSlug}`)
            break
          }

          // Determinar si es trial
          const isTrial = productId.includes('trial')
          const period = getPeriodFromProduct(productId)

          // ✅ Obtener user_id desde pending_purchases
          const pendingPurchase = await findPendingPurchase('apple', originalTransactionId)

          if (!pendingPurchase) {
            console.error(`[Apple Webhook] Pending purchase not found: ${originalTransactionId}`)
            break
          }

          const userId = pendingPurchase.user_id

          subscription = await createSubscription({
            user_id: userId,
            plan_id: plan.id,
            status: isTrial ? 'trial' : 'active',
            platform: 'apple',
            platform_subscription_id: originalTransactionId,
            period,
            started_at: new Date(purchaseDate),
            expires_at: new Date(expiresDate),
            trial_ends_at: isTrial ? new Date(expiresDate) : null,
          })

          await logSubscriptionEvent({
            user_id: userId,
            event_type: isTrial ? 'trial_started' : 'upgraded',
            to_plan_id: plan.id,
            platform: 'apple',
            metadata: { originalTransactionId, productId },
          })

          // Marcar compra pendiente como completada
          await completePendingPurchase(pendingPurchase.id)

          await invalidateUserSession(userId, 'webhook_apple_subscribed')
        }
        break

      case 'DID_RENEW':
        // Renovación exitosa
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'active',
            expires_at: new Date(expiresDate),
            trial_ends_at: null,
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'renewed',
            to_plan_id: subscription.plan_id,
            platform: 'apple',
            metadata: { originalTransactionId, expiresDate },
          })

          await invalidateUserSession(subscription.user_id, 'webhook_apple_renewed')
        }
        break

      case 'DID_FAIL_TO_RENEW':
        // Falló el pago
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'payment_failed',
            expires_at: gracePeriodExpiresDate
              ? new Date(gracePeriodExpiresDate)
              : new Date(expiresDate),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'payment_failed',
            from_plan_id: subscription.plan_id,
            platform: 'apple',
            metadata: { originalTransactionId, gracePeriodExpiresDate },
          })

          await invalidateUserSession(subscription.user_id, 'webhook_apple_payment_failed')

          // TODO: Enviar email/notificación al usuario
        }
        break

      case 'EXPIRED':
        // Subscription expiró
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'cancelled',
            expires_at: new Date(expiresDate),
            cancelled_at: new Date(),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'expired',
            from_plan_id: subscription.plan_id,
            platform: 'apple',
            metadata: { originalTransactionId, subtype },
          })

          await invalidateUserSession(subscription.user_id, 'webhook_apple_expired')
        }
        break

      case 'GRACE_PERIOD_EXPIRED':
        // Grace period terminó sin pago
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'cancelled',
            expires_at: new Date(),
            cancelled_at: new Date(),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'grace_period_expired',
            from_plan_id: subscription.plan_id,
            platform: 'apple',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_apple_grace_expired')
        }
        break

      case 'REFUND':
        // Reembolso otorgado
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'refunded',
            cancelled_at: new Date(),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'refunded',
            from_plan_id: subscription.plan_id,
            platform: 'apple',
            metadata: { originalTransactionId },
          })

          await invalidateUserSession(subscription.user_id, 'webhook_apple_refunded')
        }
        break

      case 'DID_CHANGE_RENEWAL_STATUS':
        // Usuario activó/desactivó auto-renewal
        if (subtype === 'AUTO_RENEW_DISABLED' && subscription) {
          await updateSubscription(subscription.id, {
            cancelled_at: new Date(),
            // expires_at NO cambia - mantiene acceso hasta expiración
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'auto_renew_disabled',
            from_plan_id: subscription.plan_id,
            platform: 'apple',
          })
        }
        break

      default:
        console.log(`[Apple Webhook] Unhandled event: ${notificationType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Apple Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
