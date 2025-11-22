/**
 * Google Play Store Webhook Handler
 *
 * Recibe notificaciones en tiempo real de Google Play cuando:
 * - Un usuario compra/renueva una subscription
 * - Falló un pago
 * - Una subscription expiró o fue cancelada
 * - La cuenta está en espera (on hold)
 *
 * Docs: https://developer.android.com/google/play/billing/rtdn-reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyGoogleWebhook } from '@/infrastructure/utils/webhook-verification'
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
 * Tipos de notificación de Google Play
 */
const GOOGLE_NOTIFICATION_TYPES = {
  SUBSCRIPTION_RECOVERED: 1,
  SUBSCRIPTION_RENEWED: 2,
  SUBSCRIPTION_CANCELED: 3,
  SUBSCRIPTION_PURCHASED: 4,
  SUBSCRIPTION_ON_HOLD: 5,
  SUBSCRIPTION_IN_GRACE_PERIOD: 6,
  SUBSCRIPTION_RESTARTED: 7,
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
  SUBSCRIPTION_DEFERRED: 9,
  SUBSCRIPTION_PAUSED: 10,
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
  SUBSCRIPTION_REVOKED: 12,
  SUBSCRIPTION_EXPIRED: 13,
} as const

/**
 * Mapear product ID de Google a plan slug en DB
 */
function mapGoogleProductToPlan(productId: string): string {
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
 * POST /api/webhooks/google
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Google envía el webhook en formato Pub/Sub
    const message = body.message

    if (!message || !message.data) {
      console.error('[Google Webhook] Missing message data')
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // 1. Decodificar mensaje base64
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8')
    const notification = JSON.parse(decodedData)

    // 2. Verificar autenticidad (si no usas Cloud Functions)
    // Si usas Cloud Functions, la verificación es automática
    const signature = req.headers.get('x-goog-signature')
    if (signature) {
      const isValid = await verifyGoogleWebhook(message.data, signature)
      if (!isValid) {
        console.error('[Google Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // 3. Extraer datos de la notificación
    const {
      packageName,
      eventTimeMillis,
      subscriptionNotification,
      testNotification,
    } = notification

    // Ignorar notificaciones de test
    if (testNotification) {
      console.log('[Google Webhook] Test notification received')
      return NextResponse.json({ received: true })
    }

    if (!subscriptionNotification) {
      console.error('[Google Webhook] Missing subscriptionNotification')
      return NextResponse.json({ error: 'Missing subscriptionNotification' }, { status: 400 })
    }

    const {
      version,
      notificationType,
      purchaseToken,
      subscriptionId,
    } = subscriptionNotification

    console.log(
      `[Google Webhook] Type ${notificationType} (${getNotificationTypeName(notificationType)})`,
      { purchaseToken, subscriptionId }
    )

    // 4. Buscar subscription existente
    let subscription = await findSubscriptionByPlatformId('google', purchaseToken)

    // 5. Procesar evento según tipo
    switch (notificationType) {
      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PURCHASED:
      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RECOVERED:
        // Nueva compra o recuperación
        const planSlug = mapGoogleProductToPlan(subscriptionId)
        const plan = await findPlanBySlug(planSlug)

        if (!plan) {
          console.error(`[Google Webhook] Plan not found: ${planSlug}`)
          break
        }

        const period = getPeriodFromProduct(subscriptionId)

        // ✅ Obtener user_id desde pending_purchases
        const pendingPurchase = await findPendingPurchase('google', purchaseToken)

        if (!pendingPurchase) {
          console.error(`[Google Webhook] Pending purchase not found: ${purchaseToken}`)
          break
        }

        const userId = pendingPurchase.user_id

        // Calcular expires_at (requiere llamar a API)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días

        if (!subscription) {
          subscription = await createSubscription({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            platform: 'google',
            platform_subscription_id: purchaseToken,
            period,
            started_at: new Date(parseInt(eventTimeMillis)),
            expires_at: expiresAt,
            trial_ends_at: null,
          })

          await logSubscriptionEvent({
            user_id: userId,
            event_type: 'upgraded',
            to_plan_id: plan.id,
            platform: 'google',
            metadata: { purchaseToken, subscriptionId },
          })

          // Marcar compra pendiente como completada
          await completePendingPurchase(pendingPurchase.id)
        } else {
          await updateSubscription(subscription.id, {
            status: 'active',
            expires_at: expiresAt,
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'recovered',
            to_plan_id: subscription.plan_id,
            platform: 'google',
          })
        }

        await invalidateUserSession(subscription?.user_id || userId, 'webhook_google_purchased')
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        // Renovación exitosa
        if (subscription) {
          // TODO: Obtener nueva fecha de expiración de Google Play API
          const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

          await updateSubscription(subscription.id, {
            status: 'active',
            expires_at: newExpiresAt,
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'renewed',
            to_plan_id: subscription.plan_id,
            platform: 'google',
            metadata: { purchaseToken },
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_renewed')
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_CANCELED:
        // Usuario canceló
        if (subscription) {
          await updateSubscription(subscription.id, {
            cancelled_at: new Date(),
            // expires_at NO cambia - mantiene acceso hasta expiración
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'cancelled',
            from_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_canceled')
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_IN_GRACE_PERIOD:
        // Falló el pago, en grace period
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'payment_failed',
            // TODO: Obtener grace period expiry date de API
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'payment_failed',
            from_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_grace_period')

          // TODO: Enviar email/notificación al usuario
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
        // Subscription expiró
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'cancelled',
            expires_at: new Date(),
            cancelled_at: new Date(),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'expired',
            from_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_expired')
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_ON_HOLD:
        // Cuenta en espera (suspendida)
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'payment_failed',
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'on_hold',
            from_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_on_hold')
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_REVOKED:
        // Google revocó la subscription (reembolso, fraude)
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'refunded',
            cancelled_at: new Date(),
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'refunded',
            from_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_revoked')
        }
        break

      case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RESTARTED:
        // Usuario reactivó después de cancelar
        if (subscription) {
          await updateSubscription(subscription.id, {
            status: 'active',
            cancelled_at: null,
          })

          await logSubscriptionEvent({
            user_id: subscription.user_id,
            event_type: 'restarted',
            to_plan_id: subscription.plan_id,
            platform: 'google',
          })

          await invalidateUserSession(subscription.user_id, 'webhook_google_restarted')
        }
        break

      default:
        console.log(`[Google Webhook] Unhandled notification type: ${notificationType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Google Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Helper: obtener nombre legible del tipo de notificación
 */
function getNotificationTypeName(type: number): string {
  const entry = Object.entries(GOOGLE_NOTIFICATION_TYPES).find(([_, value]) => value === type)
  return entry ? entry[0] : 'UNKNOWN'
}
