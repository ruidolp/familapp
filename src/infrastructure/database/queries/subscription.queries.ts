/**
 * User Subscription Queries
 *
 * Queries para gestionar suscripciones activas de usuarios.
 */

import { db } from '../kysely'
import type { UserSubscriptionsTable, SubscriptionStatus, SubscriptionPlatform, SubscriptionPeriod } from '../types'

export type CreateSubscriptionData = {
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  platform?: SubscriptionPlatform | null
  platform_subscription_id?: string | null
  period?: SubscriptionPeriod | null
  started_at: Date
  expires_at?: Date | null
  trial_ends_at?: Date | null
}

export type UpdateSubscriptionData = {
  plan_id?: string
  status?: SubscriptionStatus
  expires_at?: Date | null
  trial_ends_at?: Date | null
  cancelled_at?: Date | null
  platform_subscription_id?: string | null
}

/**
 * Crear una nueva suscripción para un usuario
 */
export async function createSubscription(data: CreateSubscriptionData) {
  return await db
    .insertInto('user_subscriptions')
    .values({
      ...data,
      started_at: data.started_at,
      expires_at: data.expires_at || null,
      trial_ends_at: data.trial_ends_at || null,
      platform: data.platform || null,
      platform_subscription_id: data.platform_subscription_id || null,
      period: data.period || null,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Obtener suscripción activa de un usuario
 * Una suscripción se considera activa si su status es trial, active o payment_failed
 */
export async function findActiveSubscription(userId: string) {
  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('user_id', '=', userId)
    .where('status', 'in', ['trial', 'active', 'payment_failed'])
    .orderBy('created_at', 'desc')
    .executeTakeFirst()
}

/**
 * Obtener suscripción activa de un usuario con detalles del plan
 */
export async function findActiveSubscriptionWithPlan(userId: string) {
  return await db
    .selectFrom('user_subscriptions as us')
    .innerJoin('subscription_plans as sp', 'us.plan_id', 'sp.id')
    .selectAll('us')
    .select([
      'sp.slug as plan_slug',
      'sp.name as plan_name',
      'sp.max_linked_users as plan_max_linked_users',
    ])
    .where('us.user_id', '=', userId)
    .where('us.status', 'in', ['trial', 'active', 'payment_failed'])
    .orderBy('us.created_at', 'desc')
    .executeTakeFirst()
}

/**
 * Obtener todas las suscripciones de un usuario (historial)
 */
export async function findUserSubscriptions(userId: string) {
  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Actualizar suscripción por ID
 */
export async function updateSubscription(subscriptionId: string, data: UpdateSubscriptionData) {
  return await db
    .updateTable('user_subscriptions')
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where('id', '=', subscriptionId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar suscripción por user_id
 */
export async function updateUserSubscription(userId: string, data: UpdateSubscriptionData) {
  return await db
    .updateTable('user_subscriptions')
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where('user_id', '=', userId)
    .where('status', 'in', ['trial', 'active', 'payment_failed'])
    .returningAll()
    .executeTakeFirst()
}

/**
 * Cancelar suscripción (marca como cancelada pero no elimina)
 */
export async function cancelSubscription(userId: string) {
  return await db
    .updateTable('user_subscriptions')
    .set({
      status: 'cancelled',
      cancelled_at: new Date(),
      updated_at: new Date(),
    })
    .where('user_id', '=', userId)
    .where('status', 'in', ['trial', 'active'])
    .returningAll()
    .executeTakeFirst()
}

/**
 * Obtener suscripciones que están en trial y próximas a expirar
 * Útil para notificaciones
 */
export async function getExpiringTrials(daysBeforeExpiry: number) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry)

  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('status', '=', 'trial')
    .where('trial_ends_at', '<=', targetDate)
    .where('trial_ends_at', '>', new Date())
    .execute()
}

/**
 * Obtener trials expirados que aún no han sido procesados
 */
export async function getExpiredTrials() {
  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('status', '=', 'trial')
    .where('trial_ends_at', '<=', new Date())
    .execute()
}

/**
 * Obtener suscripciones pagadas que han expirado
 */
export async function getExpiredPaidSubscriptions() {
  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('status', '=', 'active')
    .where('expires_at', '<=', new Date())
    .execute()
}

/**
 * Buscar suscripción por ID de plataforma (Stripe, Apple, Google)
 */
export async function findSubscriptionByPlatformId(
  platform: SubscriptionPlatform,
  platformSubscriptionId: string
) {
  return await db
    .selectFrom('user_subscriptions')
    .selectAll()
    .where('platform', '=', platform)
    .where('platform_subscription_id', '=', platformSubscriptionId)
    .executeTakeFirst()
}

/**
 * Contar usuarios vinculados a un owner
 */
export async function countLinkedUsers(ownerUserId: string): Promise<number> {
  const result = await db
    .selectFrom('linked_users')
    .select(db.fn.count<number>('id').as('count'))
    .where('owner_user_id', '=', ownerUserId)
    .executeTakeFirst()

  return Number(result?.count || 0)
}
