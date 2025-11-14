/**
 * Subscription Service
 *
 * Servicio principal de gestión de suscripciones.
 * Contiene toda la lógica de negocio del módulo de suscripciones.
 *
 * Este módulo es completamente agnóstico del dominio de negocio.
 */

import {
  // Plan queries
  getActivePlans,
  findPlanBySlug,
  findPlanById,
  getPlanCapabilities,
  planHasCapability,
  getPlanLimits,
  getPlanResourceLimit,
  getPlanWithDetails,
  getPaymentProducts,

  // Subscription queries
  createSubscription,
  findActiveSubscription,
  findActiveSubscriptionWithPlan,
  updateSubscription,
  updateUserSubscription,
  cancelSubscription as cancelSubscriptionQuery,

  // Invitation queries
  createInvitation,
  findValidInvitation,
  incrementInvitationUses,
  linkUser,
  unlinkUser,
  getLinkedUsers,
  findUserLink,
  findLinkOwner,
  unlinkAllUsers,
  hasCircularLink,
  countLinkedUsers,

  // History queries
  logSubscriptionEvent,
  getUserHistory,
} from '@/infrastructure/database/queries'

import type {
  SubscriptionStatus,
  SubscriptionPlatform,
  SubscriptionPeriod,
} from '@/infrastructure/database/types'

/**
 * Tipos de retorno
 */

export type ActivePlan = {
  planId: string
  planSlug: string
  planName: string
  status: SubscriptionStatus
  isLinked: boolean
  ownerId: string | null
  capabilities: string[]
  limits: Record<string, number | null>
  expiresAt: Date | null
  trialEndsAt: Date | null
}

export type UserSubscriptionInfo = {
  plan: ActivePlan
  linkedUsers: number
  maxLinkedUsers: number
  canInvite: boolean
}

export type CapabilityCheck = {
  allowed: boolean
  reason?: string
}

export type ResourceLimitCheck = {
  allowed: boolean
  limit: number | null
  current: number
  remaining: number | null
  reason?: string
}

/**
 * ====================================================================
 * DETERMINAR PLAN ACTIVO
 * ====================================================================
 */

/**
 * Obtener el plan activo efectivo de un usuario.
 *
 * Lógica:
 * 1. Si el usuario tiene una suscripción propia activa → usar esa
 * 2. Si no, verificar si está vinculado a otro usuario → heredar plan del owner
 * 3. Si no, plan FREE por defecto
 */
export async function getUserActivePlan(userId: string): Promise<ActivePlan> {
  // 1. Verificar si tiene suscripción propia
  const userSub = await findActiveSubscriptionWithPlan(userId)

  if (userSub) {
    // Tiene suscripción propia activa
    const capabilities = await getPlanCapabilities(userSub.plan_id)
    const limits = await getPlanLimits(userSub.plan_id)

    return {
      planId: userSub.plan_id,
      planSlug: userSub.plan_slug,
      planName: userSub.plan_name,
      status: userSub.status,
      isLinked: false,
      ownerId: null,
      capabilities: capabilities.map(c => c.capability_key),
      limits: limits.reduce((acc, l) => {
        acc[l.resource_key] = l.max_quantity
        return acc
      }, {} as Record<string, number | null>),
      expiresAt: userSub.expires_at ? new Date(userSub.expires_at) : null,
      trialEndsAt: userSub.trial_ends_at ? new Date(userSub.trial_ends_at) : null,
    }
  }

  // 2. Verificar si está vinculado a alguien
  const link = await findUserLink(userId)

  if (link) {
    // Está vinculado, obtener plan del owner
    const ownerSub = await findActiveSubscriptionWithPlan(link.owner_user_id)

    if (ownerSub) {
      // El owner tiene un plan activo, heredarlo
      const capabilities = await getPlanCapabilities(ownerSub.plan_id)
      const limits = await getPlanLimits(ownerSub.plan_id)

      return {
        planId: ownerSub.plan_id,
        planSlug: ownerSub.plan_slug,
        planName: ownerSub.plan_name,
        status: ownerSub.status,
        isLinked: true,
        ownerId: link.owner_user_id,
        capabilities: capabilities.map(c => c.capability_key),
        limits: limits.reduce((acc, l) => {
          acc[l.resource_key] = l.max_quantity
          return acc
        }, {} as Record<string, number | null>),
        expiresAt: ownerSub.expires_at ? new Date(ownerSub.expires_at) : null,
        trialEndsAt: ownerSub.trial_ends_at ? new Date(ownerSub.trial_ends_at) : null,
      }
    }
  }

  // 3. Plan FREE por defecto
  const freePlan = await findPlanBySlug('free')

  if (!freePlan) {
    throw new Error('Plan FREE no configurado en el sistema')
  }

  const capabilities = await getPlanCapabilities(freePlan.id)
  const limits = await getPlanLimits(freePlan.id)

  return {
    planId: freePlan.id,
    planSlug: 'free',
    planName: freePlan.name,
    status: 'free',
    isLinked: false,
    ownerId: null,
    capabilities: capabilities.map(c => c.capability_key),
    limits: limits.reduce((acc, l) => {
      acc[l.resource_key] = l.max_quantity
      return acc
    }, {} as Record<string, number | null>),
    expiresAt: null,
    trialEndsAt: null,
  }
}

/**
 * ====================================================================
 * VALIDACIÓN DE CAPACIDADES
 * ====================================================================
 */

/**
 * Verificar si un usuario tiene una capacidad específica
 */
export async function hasCapability(userId: string, capabilityKey: string): Promise<boolean> {
  const activePlan = await getUserActivePlan(userId)
  return activePlan.capabilities.includes(capabilityKey)
}

/**
 * Verificar capacidad con detalles
 */
export async function checkCapability(userId: string, capabilityKey: string): Promise<CapabilityCheck> {
  const activePlan = await getUserActivePlan(userId)
  const allowed = activePlan.capabilities.includes(capabilityKey)

  return {
    allowed,
    reason: allowed ? undefined : `Upgrade to ${activePlan.planSlug === 'free' ? 'Premium' : 'higher'} plan required`,
  }
}

/**
 * Obtener todas las capacidades del usuario
 */
export async function getUserCapabilities(userId: string): Promise<string[]> {
  const activePlan = await getUserActivePlan(userId)
  return activePlan.capabilities
}

/**
 * ====================================================================
 * VALIDACIÓN DE LÍMITES DE RECURSOS
 * ====================================================================
 */

/**
 * Verificar si un usuario puede crear un recurso dado su límite
 *
 * @param userId - ID del usuario
 * @param resourceKey - Clave del recurso (ej: 'projects', 'storage_mb')
 * @param currentCount - Cantidad actual que el usuario tiene
 */
export async function canCreateResource(
  userId: string,
  resourceKey: string,
  currentCount: number
): Promise<ResourceLimitCheck> {
  const activePlan = await getUserActivePlan(userId)
  const limit = activePlan.limits[resourceKey]

  // Si el límite es null = ilimitado
  if (limit === null || limit === undefined) {
    return {
      allowed: true,
      limit: null,
      current: currentCount,
      remaining: null,
    }
  }

  // Verificar si está dentro del límite
  const allowed = currentCount < limit
  const remaining = limit - currentCount

  return {
    allowed,
    limit,
    current: currentCount,
    remaining: remaining > 0 ? remaining : 0,
    reason: allowed ? undefined : `Limit reached (${limit} max)`,
  }
}

/**
 * Obtener todos los límites del usuario
 */
export async function getUserLimits(userId: string): Promise<Record<string, number | null>> {
  const activePlan = await getUserActivePlan(userId)
  return activePlan.limits
}

/**
 * ====================================================================
 * GESTIÓN DE PLANES
 * ====================================================================
 */

/**
 * Iniciar trial para un usuario nuevo
 */
export async function startTrial(userId: string, planSlug: string = 'premium') {
  const plan = await findPlanBySlug(planSlug)

  if (!plan) {
    throw new Error(`Plan ${planSlug} not found`)
  }

  if (plan.trial_days === 0) {
    throw new Error(`Plan ${planSlug} does not have trial`)
  }

  // Calcular fecha de fin del trial
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + plan.trial_days)

  const subscription = await createSubscription({
    user_id: userId,
    plan_id: plan.id,
    status: 'trial',
    started_at: new Date(),
    trial_ends_at: trialEndsAt,
  })

  // Log en historial
  await logSubscriptionEvent({
    user_id: userId,
    event_type: 'trial_started',
    to_plan_id: plan.id,
    metadata: { trial_days: plan.trial_days },
  })

  return subscription
}

/**
 * Upgrade de plan (FREE → PREMIUM, etc.)
 */
export async function upgradePlan(
  userId: string,
  newPlanSlug: string,
  platform: SubscriptionPlatform,
  period: SubscriptionPeriod,
  platformSubscriptionId?: string
) {
  const newPlan = await findPlanBySlug(newPlanSlug)

  if (!newPlan) {
    throw new Error(`Plan ${newPlanSlug} not found`)
  }

  // Obtener suscripción actual
  const currentSub = await findActiveSubscription(userId)
  const currentPlanId = currentSub?.plan_id || null

  // Calcular fecha de expiración (30 días para mensual, 365 para anual)
  const expiresAt = new Date()
  if (period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  let subscription

  if (currentSub) {
    // Actualizar suscripción existente
    subscription = await updateSubscription(currentSub.id, {
      plan_id: newPlan.id, // ✅ CRITICAL: Cambiar al nuevo plan
      status: 'active',
      expires_at: expiresAt,
      trial_ends_at: null, // Cancelar trial si existía
    })
  } else {
    // Crear nueva suscripción
    subscription = await createSubscription({
      user_id: userId,
      plan_id: newPlan.id,
      status: 'active',
      platform,
      period,
      platform_subscription_id: platformSubscriptionId || null,
      started_at: new Date(),
      expires_at: expiresAt,
    })
  }

  // Log en historial
  await logSubscriptionEvent({
    user_id: userId,
    event_type: 'upgraded',
    from_plan_id: currentPlanId,
    to_plan_id: newPlan.id,
    platform,
    metadata: { period, platform_subscription_id: platformSubscriptionId },
  })

  return subscription
}

/**
 * Downgrade a plan FREE
 */
export async function downgradePlan(userId: string) {
  const freePlan = await findPlanBySlug('free')

  if (!freePlan) {
    throw new Error('Plan FREE not found')
  }

  const currentSub = await findActiveSubscription(userId)

  if (!currentSub) {
    // Ya está en FREE (no tiene suscripción activa)
    return null
  }

  const subscription = await updateSubscription(currentSub.id, {
    status: 'free',
    expires_at: null,
    trial_ends_at: null,
    cancelled_at: new Date(),
  })

  // Log en historial
  await logSubscriptionEvent({
    user_id: userId,
    event_type: 'downgraded',
    from_plan_id: currentSub.plan_id,
    to_plan_id: freePlan.id,
  })

  // Desvincular todos los usuarios vinculados
  await unlinkAllUsers(userId)

  return subscription
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(userId: string) {
  const subscription = await cancelSubscriptionQuery(userId)

  if (!subscription) {
    throw new Error('No active subscription found')
  }

  // Log en historial
  await logSubscriptionEvent({
    user_id: userId,
    event_type: 'cancelled',
    from_plan_id: subscription.plan_id,
    to_plan_id: null,
  })

  // Desvincular todos los usuarios vinculados
  await unlinkAllUsers(userId)

  return subscription
}

/**
 * Obtener estado completo de suscripción
 */
export async function getSubscriptionStatus(userId: string): Promise<UserSubscriptionInfo> {
  const plan = await getUserActivePlan(userId)
  const linkedCount = await countLinkedUsers(userId)
  const freePlan = await findPlanBySlug('free')
  const currentPlan = await findPlanById(plan.planId)

  const maxLinked = currentPlan?.max_linked_users || 0
  const canInvite = plan.planSlug !== 'free' && linkedCount < maxLinked

  return {
    plan,
    linkedUsers: linkedCount,
    maxLinkedUsers: maxLinked,
    canInvite,
  }
}

/**
 * ====================================================================
 * GESTIÓN DE INVITACIONES Y VINCULACIÓN
 * ====================================================================
 */

/**
 * Generar código de invitación único
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin I, O, 0, 1 para evitar confusión
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generar invitación para vincular usuario
 */
export async function generateInvitation(
  ownerUserId: string,
  maxUses: number = 1,
  expiresInDays: number = 30
) {
  // Verificar que el owner tiene un plan que permite invitaciones
  const ownerPlan = await getUserActivePlan(ownerUserId)

  if (ownerPlan.planSlug === 'free') {
    throw new Error('FREE plan cannot invite users')
  }

  // Verificar que no ha alcanzado el límite de usuarios vinculados
  const linkedCount = await countLinkedUsers(ownerUserId)
  const ownerPlanDetails = await findPlanById(ownerPlan.planId)

  if (!ownerPlanDetails) {
    throw new Error('Plan not found')
  }

  if (linkedCount >= ownerPlanDetails.max_linked_users) {
    throw new Error(`Maximum linked users reached (${ownerPlanDetails.max_linked_users})`)
  }

  // Generar código único
  const code = generateInvitationCode()

  // Calcular fecha de expiración
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const invitation = await createInvitation({
    code,
    owner_user_id: ownerUserId,
    plan_id: ownerPlan.planId,
    max_uses: maxUses,
    expires_at: expiresAt,
  })

  return invitation
}

/**
 * Validar código de invitación sin aceptarlo
 */
export async function validateInvitationCode(code: string) {
  const invitation = await findValidInvitation(code)

  if (!invitation) {
    return {
      valid: false,
      reason: 'Invalid, expired, or already used invitation code',
    }
  }

  const plan = await findPlanById(invitation.plan_id)

  return {
    valid: true,
    planSlug: plan?.slug,
    planName: plan?.name,
    expiresAt: invitation.expires_at,
  }
}

/**
 * Aceptar invitación y vincular usuario
 */
export async function acceptInvitation(userId: string, code: string) {
  // Validar código
  const invitation = await findValidInvitation(code)

  if (!invitation) {
    throw new Error('Invalid, expired, or already used invitation code')
  }

  // Verificar que el usuario no esté ya vinculado
  const existingLink = await findUserLink(userId)

  if (existingLink) {
    throw new Error('User is already linked to another plan')
  }

  // Verificar vinculación circular
  const circular = await hasCircularLink(invitation.owner_user_id, userId)

  if (circular) {
    throw new Error('Circular linking is not allowed')
  }

  // Incrementar contador de usos
  await incrementInvitationUses(invitation.id)

  // Vincular usuario
  const link = await linkUser({
    owner_user_id: invitation.owner_user_id,
    linked_user_id: userId,
  })

  // Si el usuario tenía una suscripción propia activa, cancelarla
  const userSub = await findActiveSubscription(userId)
  if (userSub) {
    await updateSubscription(userSub.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    })
  }

  // Log en historial
  await logSubscriptionEvent({
    user_id: userId,
    event_type: 'linked',
    to_plan_id: invitation.plan_id,
    metadata: { owner_user_id: invitation.owner_user_id },
  })

  return link
}

/**
 * Obtener usuarios vinculados de un owner
 */
export async function getUserLinkedUsers(ownerUserId: string) {
  return await getLinkedUsers(ownerUserId)
}

/**
 * Desvincular un usuario
 */
export async function unlinkUserFromPlan(ownerUserId: string, linkedUserId: string) {
  const result = await unlinkUser(ownerUserId, linkedUserId)

  if (!result) {
    throw new Error('Linked user not found')
  }

  // Log en historial
  await logSubscriptionEvent({
    user_id: linkedUserId,
    event_type: 'unlinked',
    metadata: { owner_user_id: ownerUserId },
  })

  return result
}

/**
 * ====================================================================
 * ADMIN / UTILIDADES
 * ====================================================================
 */

/**
 * Obtener todos los planes disponibles con sus precios
 */
export async function getAvailablePlans(currency: string = 'USD') {
  const plans = await getActivePlans()

  const plansWithPrices = await Promise.all(
    plans.map(async (plan) => {
      const products = await getPaymentProducts(plan.id, undefined, currency)
      const capabilities = await getPlanCapabilities(plan.id)
      const limits = await getPlanLimits(plan.id)

      return {
        ...plan,
        capabilities: capabilities.map(c => c.capability_key),
        limits: limits.reduce((acc, l) => {
          acc[l.resource_key] = l.max_quantity
          return acc
        }, {} as Record<string, number | null>),
        prices: products,
      }
    })
  )

  return plansWithPrices
}

/**
 * Obtener historial de suscripción de un usuario
 */
export async function getSubscriptionHistory(userId: string) {
  return await getUserHistory(userId)
}
