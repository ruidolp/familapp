/**
 * Subscription Plan Queries
 *
 * Queries para gestionar planes de suscripción, capacidades y límites.
 */

import { db } from '../kysely'
import type { SubscriptionPlansTable, PlanCapabilitiesTable, PlanLimitsTable } from '../types'

/**
 * Obtener todos los planes activos
 */
export async function getActivePlans() {
  return await db
    .selectFrom('subscription_plans')
    .selectAll()
    .where('active', '=', true)
    .orderBy('slug', 'asc')
    .execute()
}

/**
 * Obtener un plan por su slug
 */
export async function findPlanBySlug(slug: string) {
  return await db
    .selectFrom('subscription_plans')
    .selectAll()
    .where('slug', '=', slug)
    .where('active', '=', true)
    .executeTakeFirst()
}

/**
 * Obtener un plan por su ID
 */
export async function findPlanById(planId: string) {
  return await db
    .selectFrom('subscription_plans')
    .selectAll()
    .where('id', '=', planId)
    .executeTakeFirst()
}

/**
 * Obtener capacidades de un plan
 */
export async function getPlanCapabilities(planId: string) {
  return await db
    .selectFrom('plan_capabilities')
    .selectAll()
    .where('plan_id', '=', planId)
    .where('enabled', '=', true)
    .execute()
}

/**
 * Verificar si un plan tiene una capacidad específica
 */
export async function planHasCapability(planId: string, capabilityKey: string): Promise<boolean> {
  const result = await db
    .selectFrom('plan_capabilities')
    .select('enabled')
    .where('plan_id', '=', planId)
    .where('capability_key', '=', capabilityKey)
    .where('enabled', '=', true)
    .executeTakeFirst()

  return !!result
}

/**
 * Obtener límites de recursos de un plan
 */
export async function getPlanLimits(planId: string) {
  return await db
    .selectFrom('plan_limits')
    .selectAll()
    .where('plan_id', '=', planId)
    .execute()
}

/**
 * Obtener límite específico de un recurso
 */
export async function getPlanResourceLimit(planId: string, resourceKey: string) {
  return await db
    .selectFrom('plan_limits')
    .select('max_quantity')
    .where('plan_id', '=', planId)
    .where('resource_key', '=', resourceKey)
    .executeTakeFirst()
}

/**
 * Obtener plan completo con capacidades y límites
 */
export async function getPlanWithDetails(planId: string) {
  const plan = await findPlanById(planId)
  if (!plan) return null

  const capabilities = await getPlanCapabilities(planId)
  const limits = await getPlanLimits(planId)

  return {
    ...plan,
    capabilities,
    limits,
  }
}

/**
 * Obtener productos de pago para un plan
 */
export async function getPaymentProducts(planId: string, platform?: string, currency?: string) {
  let query = db
    .selectFrom('payment_products')
    .selectAll()
    .where('plan_id', '=', planId)
    .where('active', '=', true)

  if (platform) {
    query = query.where('platform', '=', platform as any)
  }

  if (currency) {
    query = query.where('currency', '=', currency)
  }

  return await query.execute()
}

/**
 * Obtener precio específico de un producto
 */
export async function getProductPrice(
  planId: string,
  platform: string,
  period: string,
  currency: string
) {
  return await db
    .selectFrom('payment_products')
    .selectAll()
    .where('plan_id', '=', planId)
    .where('platform', '=', platform as any)
    .where('period', '=', period as any)
    .where('currency', '=', currency)
    .where('active', '=', true)
    .executeTakeFirst()
}
