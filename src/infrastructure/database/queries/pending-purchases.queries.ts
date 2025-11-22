/**
 * Pending Purchases Queries
 *
 * Queries para gestionar compras pendientes de App Stores.
 * Permite mapear transactionId -> userId durante el proceso de compra.
 */

import { db } from '../kysely'

export type CreatePendingPurchaseData = {
  user_id: string
  platform: 'apple' | 'google' | 'sandbox'
  transaction_id: string
  product_id: string
}

/**
 * Registrar una compra pendiente cuando el usuario inicia el proceso
 */
export async function createPendingPurchase(data: CreatePendingPurchaseData) {
  return await db
    .insertInto('pending_purchases')
    .values({
      ...data,
      status: 'pending',
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar compra pendiente por transactionId
 */
export async function findPendingPurchase(
  platform: 'apple' | 'google' | 'sandbox',
  transactionId: string
) {
  return await db
    .selectFrom('pending_purchases')
    .selectAll()
    .where('platform', '=', platform)
    .where('transaction_id', '=', transactionId)
    .where('status', '=', 'pending')
    .executeTakeFirst()
}

/**
 * Marcar compra como completada
 */
export async function completePendingPurchase(id: string) {
  return await db
    .updateTable('pending_purchases')
    .set({
      status: 'completed',
      completed_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Marcar compra como fallida
 */
export async function failPendingPurchase(id: string) {
  return await db
    .updateTable('pending_purchases')
    .set({
      status: 'failed',
      completed_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Limpiar compras pendientes antiguas (>7 días)
 */
export async function cleanupOldPendingPurchases() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return await db
    .deleteFrom('pending_purchases')
    .where('created_at', '<', sevenDaysAgo)
    .where('status', '=', 'pending')
    .execute()
}
