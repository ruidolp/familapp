/**
 * Invitation Queries
 *
 * Queries para gestionar invitaciones y usuarios vinculados.
 */

import { db } from '../kysely'
import type { InvitationStatus } from '../types'

export type CreateInvitationData = {
  code: string
  owner_user_id: string
  plan_id: string
  max_uses: number
  expires_at: Date
}

export type CreateLinkedUserData = {
  owner_user_id: string
  linked_user_id: string
}

/**
 * Crear código de invitación
 */
export async function createInvitation(data: CreateInvitationData) {
  return await db
    .insertInto('invitation_codes')
    .values({
      ...data,
      status: 'pending',
      uses_count: 0,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar invitación por código
 */
export async function findInvitationByCode(code: string) {
  return await db
    .selectFrom('invitation_codes')
    .selectAll()
    .where('code', '=', code)
    .executeTakeFirst()
}

/**
 * Buscar invitación válida por código
 * (pending, no expirada, con usos disponibles)
 */
export async function findValidInvitation(code: string) {
  return await db
    .selectFrom('invitation_codes')
    .selectAll()
    .where('code', '=', code)
    .where('status', '=', 'pending')
    .where('expires_at', '>', new Date())
    .where((eb) => eb('uses_count', '<', eb.ref('max_uses')))
    .executeTakeFirst()
}

/**
 * Incrementar contador de usos de invitación
 */
export async function incrementInvitationUses(invitationId: string) {
  const invitation = await db
    .updateTable('invitation_codes')
    .set((eb) => ({
      uses_count: eb('uses_count', '+', 1),
      updated_at: new Date(),
    }))
    .where('id', '=', invitationId)
    .returningAll()
    .executeTakeFirst()

  // Si alcanzó el máximo de usos, marcar como aceptada
  if (invitation && invitation.uses_count >= invitation.max_uses) {
    await updateInvitationStatus(invitationId, 'accepted')
  }

  return invitation
}

/**
 * Actualizar estado de invitación
 */
export async function updateInvitationStatus(invitationId: string, status: InvitationStatus) {
  return await db
    .updateTable('invitation_codes')
    .set({
      status,
      updated_at: new Date(),
    })
    .where('id', '=', invitationId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Obtener invitaciones de un usuario (owner)
 */
export async function findUserInvitations(ownerUserId: string) {
  return await db
    .selectFrom('invitation_codes')
    .selectAll()
    .where('owner_user_id', '=', ownerUserId)
    .orderBy('created_at', 'desc')
    .execute()
}

/**
 * Revocar todas las invitaciones pendientes de un usuario
 */
export async function revokeUserInvitations(ownerUserId: string) {
  return await db
    .updateTable('invitation_codes')
    .set({
      status: 'revoked',
      updated_at: new Date(),
    })
    .where('owner_user_id', '=', ownerUserId)
    .where('status', '=', 'pending')
    .execute()
}

/**
 * Vincular usuario a otro usuario (compartir plan)
 */
export async function linkUser(data: CreateLinkedUserData) {
  return await db
    .insertInto('linked_users')
    .values({
      ...data,
      linked_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Desvincular usuario
 */
export async function unlinkUser(ownerUserId: string, linkedUserId: string) {
  return await db
    .deleteFrom('linked_users')
    .where('owner_user_id', '=', ownerUserId)
    .where('linked_user_id', '=', linkedUserId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Obtener usuarios vinculados de un owner
 */
export async function getLinkedUsers(ownerUserId: string) {
  return await db
    .selectFrom('linked_users as lu')
    .innerJoin('users as u', 'lu.linked_user_id', 'u.id')
    .select([
      'lu.id',
      'lu.owner_user_id',
      'lu.linked_user_id',
      'lu.linked_at',
      'u.name as linked_user_name',
      'u.email as linked_user_email',
      'u.image as linked_user_image',
    ])
    .where('lu.owner_user_id', '=', ownerUserId)
    .orderBy('lu.linked_at', 'desc')
    .execute()
}

/**
 * Buscar si un usuario está vinculado a alguien
 */
export async function findUserLink(linkedUserId: string) {
  return await db
    .selectFrom('linked_users')
    .selectAll()
    .where('linked_user_id', '=', linkedUserId)
    .executeTakeFirst()
}

/**
 * Buscar owner de un usuario vinculado
 */
export async function findLinkOwner(linkedUserId: string) {
  return await db
    .selectFrom('linked_users as lu')
    .innerJoin('users as u', 'lu.owner_user_id', 'u.id')
    .select([
      'lu.owner_user_id',
      'u.name as owner_name',
      'u.email as owner_email',
    ])
    .where('lu.linked_user_id', '=', linkedUserId)
    .executeTakeFirst()
}

/**
 * Desvincular todos los usuarios de un owner (cuando cancela su plan)
 */
export async function unlinkAllUsers(ownerUserId: string) {
  return await db
    .deleteFrom('linked_users')
    .where('owner_user_id', '=', ownerUserId)
    .execute()
}

/**
 * Verificar si existe una vinculación circular
 * (A no puede vincular a B si B ya tiene a A vinculado)
 */
export async function hasCircularLink(ownerUserId: string, linkedUserId: string): Promise<boolean> {
  // Verificar si linkedUserId tiene a ownerUserId como vinculado
  const result = await db
    .selectFrom('linked_users')
    .select('id')
    .where('owner_user_id', '=', linkedUserId)
    .where('linked_user_id', '=', ownerUserId)
    .executeTakeFirst()

  return !!result
}

/**
 * Expirar invitaciones vencidas
 * (Job que se ejecuta periódicamente)
 */
export async function expireOldInvitations() {
  return await db
    .updateTable('invitation_codes')
    .set({
      status: 'expired',
      updated_at: new Date(),
    })
    .where('status', '=', 'pending')
    .where('expires_at', '<=', new Date())
    .execute()
}
