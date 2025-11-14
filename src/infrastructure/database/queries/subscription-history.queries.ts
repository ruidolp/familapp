/**
 * Subscription History Queries
 *
 * Queries para registrar y consultar el historial de eventos de suscripciones.
 */

import { db } from '../kysely'
import type { SubscriptionEventType, SubscriptionPlatform } from '../types'

export type CreateHistoryEventData = {
  user_id: string
  event_type: SubscriptionEventType
  from_plan_id?: string | null
  to_plan_id?: string | null
  platform?: SubscriptionPlatform | null
  metadata?: Record<string, any> | null
}

/**
 * Registrar evento en el historial
 */
export async function logSubscriptionEvent(data: CreateHistoryEventData) {
  return await db
    .insertInto('subscription_history')
    .values({
      user_id: data.user_id,
      event_type: data.event_type,
      from_plan_id: data.from_plan_id || null,
      to_plan_id: data.to_plan_id || null,
      platform: data.platform || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Obtener historial completo de un usuario
 */
export async function getUserHistory(userId: string) {
  return await db
    .selectFrom('subscription_history as sh')
    .leftJoin('subscription_plans as fp', 'sh.from_plan_id', 'fp.id')
    .leftJoin('subscription_plans as tp', 'sh.to_plan_id', 'tp.id')
    .select([
      'sh.id',
      'sh.user_id',
      'sh.event_type',
      'sh.platform',
      'sh.metadata',
      'sh.created_at',
      'fp.slug as from_plan_slug',
      'fp.name as from_plan_name',
      'tp.slug as to_plan_slug',
      'tp.name as to_plan_name',
    ])
    .where('sh.user_id', '=', userId)
    .orderBy('sh.created_at', 'desc')
    .execute()
}

/**
 * Obtener eventos de un tipo específico para un usuario
 */
export async function getUserEventsByType(userId: string, eventType: SubscriptionEventType) {
  return await db
    .selectFrom('subscription_history')
    .selectAll()
    .where('user_id', '=', userId)
    .where('event_type', '=', eventType)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Obtener últimos N eventos de un usuario
 */
export async function getRecentUserEvents(userId: string, limit: number = 10) {
  return await db
    .selectFrom('subscription_history')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute()
}

/**
 * Obtener todos los eventos de un tipo en un rango de fechas
 * Útil para analytics y reportes
 */
export async function getEventsByTypeAndDateRange(
  eventType: SubscriptionEventType,
  startDate: Date,
  endDate: Date
) {
  return await db
    .selectFrom('subscription_history')
    .selectAll()
    .where('event_type', '=', eventType)
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Contar conversiones de trial a pago en un período
 */
export async function countTrialConversions(startDate: Date, endDate: Date): Promise<number> {
  const result = await db
    .selectFrom('subscription_history')
    .select(db.fn.count<number>('id').as('count'))
    .where('event_type', '=', 'upgraded')
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .executeTakeFirst()

  return Number(result?.count || 0)
}

/**
 * Contar cancelaciones en un período
 */
export async function countCancellations(startDate: Date, endDate: Date): Promise<number> {
  const result = await db
    .selectFrom('subscription_history')
    .select(db.fn.count<number>('id').as('count'))
    .where('event_type', '=', 'cancelled')
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .executeTakeFirst()

  return Number(result?.count || 0)
}

/**
 * Obtener estadísticas de eventos por tipo
 */
export async function getEventStatsByType(startDate: Date, endDate: Date) {
  return await db
    .selectFrom('subscription_history')
    .select([
      'event_type',
      db.fn.count<number>('id').as('count'),
    ])
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .groupBy('event_type')
    .execute()
}
